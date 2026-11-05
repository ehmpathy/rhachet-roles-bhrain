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
 * .note = which calls form the main thread is known only at the end (`asThreadMembership`):
 *         the session may switch model mid-way, and a helper model may interleave small
 *         calls. so each call records where the block log stood when it opened, and `done()`
 *         walks the thread calls in order: a thread call takes every block since the prior
 *         thread call, of whichever model. a call off the thread takes no arrivals
 * .note = deliberate mutation: the fold's state (the tool-use index, the block log, the
 *         open calls) is private to the closure; `done()` returns fresh immutable literals
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
  const opened: CallOpened[] = [];
  const openedIndexByRequestId = new Map<string, number>();
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

    // a new request opens a call, which marks where the block log and the compactions stood
    openedIndexByRequestId.set(metered.requestId, opened.length);
    opened.push({
      requestId: metered.requestId,
      model: metered.model,
      spend: metered.spend,
      blocksAt: blocks.length,
      compactionsAt: compactions,
      isSidechain: false,
    });
  };

  // a sidechain call: deduped by request like any call, but it is never on the thread, so
  // the main thread's delta sequence never sees it
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
      blocksAt: blocks.length,
      compactionsAt: compactions,
      isSidechain: true,
    });
  };

  const done = (): TranscriptCallsFolded => {
    const membership = asThreadMembership({ calls: opened });

    // each thread call takes the blocks and compactions since the prior thread call
    let threadPrior = { blocksAt: 0, compactionsAt: 0 };
    const calls = opened.map((call, index) => {
      const isMainThread = membership[index]!;
      const prior = threadPrior;
      if (isMainThread) threadPrior = call;
      return new TranscriptCall({
        ordinal: index + 1,
        requestId: call.requestId,
        model: call.model,
        isMainThread,
        spend: call.spend,
        arrivals: isMainThread
          ? blocks.slice(prior.blocksAt, call.blocksAt)
          : [],
        isAfterCompaction:
          isMainThread && call.compactionsAt > prior.compactionsAt,
      });
    });
    return { calls, records, recordsWithSpend };
  };

  return { push, done };
};

/**
 * .what = one call as the fold opened it: its spend, and where the block log and the
 *         compaction count stood at that moment
 * .why = thread membership is known only at the end, so arrivals are cut from the block
 *        log then, between consecutive thread calls
 */
interface CallOpened {
  requestId: string;
  model: string;
  spend: TranscriptCallSpend;
  blocksAt: number;
  compactionsAt: number;
  isSidechain: boolean;
}

/**
 * .what = whether each call is on the main thread: the conversation the session holds
 * .why = a session may switch model mid-way (`/model`), and the new model's calls carry
 *        the same conversation, so they are the thread too. a helper model's call (a title,
 *        a summary) carries a small prompt of its own, and stays off it
 *
 * .note = the session model (the one whose calls carried the most context) is always on
 *         the thread. a call to another model joins it when it carries the conversation:
 *         its context is at least half of the prior thread call's, or a compaction cut the
 *         context since. before any thread call, the next session-model call is the measure
 * .note = deliberate mutation: the walk keeps the last thread call in a local
 */
const asThreadMembership = (input: { calls: CallOpened[] }): boolean[] => {
  const sessionModel = asSessionModel({
    calls: input.calls.filter((call) => !call.isSidechain),
  });
  let threadLast: CallOpened | null = null;
  return input.calls.map((call, index) => {
    if (call.isSidechain) return false;
    const isJoined =
      call.model === sessionModel ||
      isCarrierOfThread({
        call,
        threadLast,
        sessionNext:
          input.calls
            .slice(index + 1)
            .find(
              (other) => !other.isSidechain && other.model === sessionModel,
            ) ?? null,
      });
    if (isJoined) threadLast = call;
    return isJoined;
  });
};

/**
 * .what = does a call to another model carry the conversation the thread holds?
 * .why = a model switch re-sends the whole conversation; a helper sends a prompt of its own
 */
const isCarrierOfThread = (input: {
  call: CallOpened;
  threadLast: CallOpened | null;
  sessionNext: CallOpened | null;
}): boolean => {
  const measure = input.threadLast ?? input.sessionNext;
  if (measure === null) return false;
  const isAfterCompaction =
    input.threadLast !== null &&
    input.call.compactionsAt > input.threadLast.compactionsAt;
  if (isAfterCompaction) return true;
  return (
    asCallContext({ call: input.call }) * 2 >= asCallContext({ call: measure })
  );
};

/**
 * .what = the model whose calls carried the most context, summed over its calls
 * .why = the session model anchors the thread; a call to another model joins it only
 *        where it carries the conversation (`asThreadMembership`)
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
