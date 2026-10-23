import { UnexpectedCodePathError } from 'helpful-errors';

import type { TokenBlock } from '@src/domain.objects/Reflector/TokenBlock';
import {
  TranscriptCall,
  type TranscriptCallSpend,
} from '@src/domain.objects/Reflector/TranscriptCall';

import { asCallContext } from './asCallContext';
import { asGroupsByKey } from './asGroupsByKey';
import { asTokenBlocks, type ToolUseIndex } from './asTokenBlocks';
import {
  isTranscriptRecord,
  type TranscriptRecord,
} from './isTranscriptRecord';

/**
 * .what = whose thread a transcript file holds
 * .why = a main transcript marks its subagents' records `isSidechain: true` and must not
 *        count them; a subagent file holds ONLY such records, and they are its own thread
 */
export type TranscriptThread = 'main' | 'subagent';

/**
 * .what = the metered calls of a transcript, and the counts its records yield
 * .why = the halt on a transcript with no call names how many records it held and how
 *        many carried a usage block, so a fixture reads apart from a torn session
 */
export interface TranscriptCallsFolded {
  calls: TranscriptCall[];
  records: number;
  recordsWithSpend: number;
}

/**
 * .what = a fold that reads one transcript record at a time into its metered calls,
 *         deduped by `requestId`, in order
 * .why = a transcript may weigh gigabytes; a fold lets the reader stream it line by line,
 *        so neither the raw text nor the record list is ever held whole
 * .why = the provider meters a request; one call may span several assistant records
 *        (thought, text, tool_use), and each repeats the usage. a naive sum double-counts
 *
 * .note = the session's own model is the one whose calls carried the most context, which
 *         is known only at the end. so each model keeps its own cursor into the arrivals: a call
 *         takes every block since the prior call of ITS model, and `done()` keeps the
 *         arrivals of the session model's calls alone. that equals a walk that knew the
 *         session model up front, since a call to another model never resets the arrivals
 * .note = deliberate mutation: the fold's state (the tool-use index, the block log, the
 *         per-model cursors, the open calls) is private to the closure; `done()` returns
 *         fresh immutable literals
 */
export const genTranscriptCallFold = (input: {
  thread: TranscriptThread;
  path: string;
}): {
  push: (input: { record: TranscriptRecord }) => void;
  done: () => TranscriptCallsFolded;
} => {
  const toolUseIndex: ToolUseIndex = new Map();
  const blocks: TokenBlock[] = [];
  const opened: {
    requestId: string;
    model: string;
    spend: TranscriptCallSpend;
    arrivals: TokenBlock[];
    isAfterCompaction: boolean;
    isSidechain: boolean;
  }[] = [];
  const openedIndexByRequestId = new Map<string, number>();
  const cursorByModel = new Map<
    string,
    { blocksFrom: number; compactionsSeen: number }
  >();
  let compactions = 0;
  let records = 0;
  let recordsWithSpend = 0;

  const push = (pushed: { record: TranscriptRecord }): void => {
    const { record } = pushed;
    records += 1;
    if (isMeteredRecord({ record })) recordsWithSpend += 1;

    // a compaction boundary cuts the context before the next call
    if (record.type === 'system' && record.subtype === 'compact_boundary') {
      compactions += 1;
      return;
    }

    // a sidechain record never enters a main transcript's context, yet its metered call
    // still counts in efficiency, as a call off the main thread
    const metered = asMeteredAssistant({ record, path: input.path });
    if (input.thread === 'main' && record.isSidechain === true) {
      if (metered) openSidechainCall({ metered });
      return;
    }

    // any record but a metered call may add model-visible blocks to the context
    if (!metered) {
      blocks.push(...asTokenBlocks({ record, toolUseIndex }));
      return;
    }
    registerToolUses({ record, toolUseIndex });

    // a later record of the same request carries the final usage
    const extantIndex = openedIndexByRequestId.get(metered.requestId);
    if (extantIndex !== undefined) {
      opened[extantIndex] = { ...opened[extantIndex]!, spend: metered.spend };
      return;
    }

    // a new request opens a call, which takes the arrivals since its model's prior call
    const cursor = cursorByModel.get(metered.model) ?? {
      blocksFrom: 0,
      compactionsSeen: 0,
    };
    openedIndexByRequestId.set(metered.requestId, opened.length);
    opened.push({
      requestId: metered.requestId,
      model: metered.model,
      spend: metered.spend,
      arrivals: blocks.slice(cursor.blocksFrom),
      isAfterCompaction: compactions > cursor.compactionsSeen,
      isSidechain: false,
    });
    cursorByModel.set(metered.model, {
      blocksFrom: blocks.length,
      compactionsSeen: compactions,
    });
  };

  // a sidechain call: deduped by request like any call, but it takes no arrivals and moves
  // no cursor, so the main thread's delta sequence never sees it
  const openSidechainCall = (sidechain: {
    metered: { requestId: string; model: string; spend: TranscriptCallSpend };
  }): void => {
    const { metered } = sidechain;
    const extantIndex = openedIndexByRequestId.get(metered.requestId);
    if (extantIndex !== undefined) {
      opened[extantIndex] = { ...opened[extantIndex]!, spend: metered.spend };
      return;
    }
    openedIndexByRequestId.set(metered.requestId, opened.length);
    opened.push({
      requestId: metered.requestId,
      model: metered.model,
      spend: metered.spend,
      arrivals: [],
      isAfterCompaction: false,
      isSidechain: true,
    });
  };

  const done = (): TranscriptCallsFolded => {
    const sessionModel = asSessionModel({
      calls: opened.filter((call) => !call.isSidechain),
    });
    return {
      calls: opened.map((call, index) => {
        const isMainThread = !call.isSidechain && call.model === sessionModel;
        return new TranscriptCall({
          ordinal: index + 1,
          requestId: call.requestId,
          model: call.model,
          isMainThread,
          spend: call.spend,
          arrivals: isMainThread ? call.arrivals : [],
          isAfterCompaction: isMainThread ? call.isAfterCompaction : false,
        });
      }),
      records,
      recordsWithSpend,
    };
  };

  return { push, done };
};

/**
 * .what = the model whose calls carried the most context, summed over its calls
 * .why = a session may interleave calls to a second model (a summary, a title); those
 *        count in efficiency but never form the context delta sequence
 *
 * .note = the weight is context, never a count of records: a helper called every turn may
 *         outnumber the main thread's calls, but each of its prompts is small, while the
 *         main thread re-sends the whole conversation each call. so many small calls can
 *         never outweigh the thread that holds the session
 * .note = a tie keeps the model seen first, since the sort is stable
 */
const asSessionModel = (input: {
  calls: { model: string; spend: TranscriptCallSpend }[];
}): string | null => {
  const contextByModel = asGroupsByKey({
    items: input.calls,
    keyOf: (call) => call.model,
  }).map((ofModel) => ({
    model: ofModel[0]!.model,
    context: ofModel.reduce((sum, call) => sum + asCallContext({ call }), 0),
  }));
  const ranked = [...contextByModel].sort((a, b) => b.context - a.context);
  return ranked[0]?.model ?? null;
};

/**
 * .what = is this an assistant record that carries a usage block?
 * .why = the count a halt names when a transcript holds no call: a fixture has none
 */
const isMeteredRecord = (input: { record: TranscriptRecord }): boolean =>
  input.record.type === 'assistant' &&
  isTranscriptRecord(input.record.message) &&
  isTranscriptRecord(input.record.message.usage);

/**
 * .what = the request id, model, and spend of an assistant record, or null if unmetered
 * .why = a `<synthetic>` record, or one with no usage or request id, is not a call
 */
const asMeteredAssistant = (input: {
  record: TranscriptRecord;
  path: string;
}): { requestId: string; model: string; spend: TranscriptCallSpend } | null => {
  const { record } = input;
  if (record.type !== 'assistant') return null;
  if (typeof record.requestId !== 'string') return null;
  const message = isTranscriptRecord(record.message) ? record.message : null;
  if (!message || typeof message.model !== 'string') return null;
  if (message.model === '<synthetic>') return null;
  if (!isTranscriptRecord(message.usage)) return null;
  return {
    requestId: record.requestId,
    model: message.model,
    spend: asCallSpend({
      metered: message.usage,
      path: input.path,
      requestId: record.requestId,
    }),
  };
};

/**
 * .what = the provider's metered fields (`message.usage` on the wire), in the report's words
 * .why = the cache write splits by ttl, and the two ttls are priced apart
 */
const asCallSpend = (input: {
  metered: TranscriptRecord;
  path: string;
  requestId: string;
}): TranscriptCallSpend => {
  const usage = input.metered;
  const count = (field: string, value: unknown): number =>
    asCount({ value, field, path: input.path, requestId: input.requestId });
  const cacheCreation = isTranscriptRecord(usage.cache_creation)
    ? usage.cache_creation
    : null;
  return {
    inputRaw: count('input_tokens', usage.input_tokens),
    cacheRead: count('cache_read_input_tokens', usage.cache_read_input_tokens),
    cacheWrite: {
      total: count(
        'cache_creation_input_tokens',
        usage.cache_creation_input_tokens,
      ),
      ttl5m: cacheCreation
        ? count(
            'cache_creation.ephemeral_5m_input_tokens',
            cacheCreation.ephemeral_5m_input_tokens,
          )
        : null,
      ttl1h: cacheCreation
        ? count(
            'cache_creation.ephemeral_1h_input_tokens',
            cacheCreation.ephemeral_1h_input_tokens,
          )
        : null,
    },
    output: count('output_tokens', usage.output_tokens),
  };
};

/**
 * .what = a usage field as a count: zero when absent, a halt when present but not a count
 * .why = an older harness omits fields it did not meter, which is a real zero; a field
 *        that is present yet not a finite number is a corrupt record, and a silent zero
 *        would price its tokens as if they never existed
 */
const asCount = (input: {
  value: unknown;
  field: string;
  path: string;
  requestId: string;
}): number => {
  if (input.value === undefined || input.value === null) return 0;
  if (typeof input.value === 'number' && Number.isFinite(input.value))
    return input.value;
  throw new UnexpectedCodePathError('malformed usage field', {
    path: input.path,
    requestId: input.requestId,
    field: input.field,
    value: JSON.stringify(input.value),
    hint: 'a usage count must be a number; re-copy the file from its source',
  });
};

/**
 * .what = records each tool use an assistant record makes, by id
 * .why = a later `tool_result` names only the id; its label needs the tool and command
 * .note = deliberate mutation: it writes into the fold's own tool-use index, which is
 *         private to the fold's closure and never escapes it
 */
const registerToolUses = (input: {
  record: TranscriptRecord;
  toolUseIndex: ToolUseIndex;
}): void => {
  const message = isTranscriptRecord(input.record.message)
    ? input.record.message
    : null;
  const content = Array.isArray(message?.content) ? message.content : [];
  for (const part of content.filter(isTranscriptRecord)) {
    if (part.type !== 'tool_use' || typeof part.id !== 'string') continue;
    const toolInput = isTranscriptRecord(part.input) ? part.input : {};
    input.toolUseIndex.set(part.id, {
      name: typeof part.name === 'string' ? part.name : 'unknown tool',
      command: typeof toolInput.command === 'string' ? toolInput.command : null,
    });
  }
};
