import * as path from 'path';

import { TokenBlock } from '@src/domain.objects/Reflector/TokenBlock';
import { isHumanTurn } from '@src/domain.operations/transcript/isHumanTurn';

import { asToolLabel } from './asToolLabel';
import {
  isTranscriptRecord,
  type TranscriptRecord,
} from './isTranscriptRecord';

/**
 * .what = the tool name (and, for Bash, the command) each `tool_use.id` names
 * .why = a `tool_result` carries only the id it answers; its row label comes from the use
 */
export type ToolUseIndex = Map<
  string,
  { name: string; command: string | null }
>;

/**
 * .what = the model-visible blocks one transcript record adds to the context
 * .why = a context delta is split across the blocks that arrived in it, so each record
 *        must name what it holds, under which category, and how many bytes the model saw
 *
 * .note = records the model never sees (titles, mode flags, file-history) yield none;
 *         assistant records yield none — their cost is measured by `output_tokens`
 */
export const asTokenBlocks = (input: {
  record: TranscriptRecord;
  toolUseIndex: ToolUseIndex;
}): TokenBlock[] => {
  const { record } = input;
  if (record.type === 'user')
    return asUserBlocks({ record, toolUseIndex: input.toolUseIndex });
  if (record.type === 'attachment') return asAttachmentBlocks({ record });
  return [];
};

/**
 * .what = the blocks of a `user` record: human words, tool results, harness text
 * .why = one `type: user` record may be a human, a tool answer, a meta replay, or the
 *        compaction summary, and each counts toward a different category
 */
const asUserBlocks = (input: {
  record: TranscriptRecord;
  toolUseIndex: ToolUseIndex;
}): TokenBlock[] => {
  const message = isTranscriptRecord(input.record.message)
    ? input.record.message
    : {};
  const content = message.content;
  const isHuman = isHumanTurn({ ...input.record, message });

  // the compaction summary is harness text that seeds the new context
  if (input.record.isCompactSummary === true)
    return [
      new TokenBlock({
        category: 'system.reminder',
        label: 'compaction.summary',
        bytes: asByteCount({ value: content }),
      }),
    ];

  // a plain string is the human, or a meta replay of harness output
  if (typeof content === 'string')
    return [
      new TokenBlock({
        category: isHuman ? 'human.words' : 'system.reminder',
        label: isHuman ? 'human' : 'meta',
        bytes: asByteCount({ value: content }),
      }),
    ];

  // an array holds tool results and text parts
  if (!Array.isArray(content)) return [];
  return content.filter(isTranscriptRecord).map((part) => {
    // a tool result is labeled by the tool use it answers
    if (part.type === 'tool_result') {
      const toolUse =
        typeof part.tool_use_id === 'string'
          ? (input.toolUseIndex.get(part.tool_use_id) ?? null)
          : null;
      return new TokenBlock({
        category: 'tool.result',
        label: toolUse ? asToolLabel(toolUse) : 'unknown tool',
        bytes: asByteCount({ value: part.content }),
      });
    }

    // a text part is the human's words, or harness text in a non-human turn
    return new TokenBlock({
      category: isHuman ? 'human.words' : 'system.reminder',
      label: isHuman ? 'human' : 'meta',
      bytes: asByteCount({ value: part.type === 'text' ? part.text : part }),
    });
  });
};

/**
 * .what = the blocks of an `attachment` record
 * .why = the boot instructions, every hook's payload, and each per-call harness reminder
 *        all arrive as attachments, told apart by `attachment.type`
 */
const asAttachmentBlocks = (input: {
  record: TranscriptRecord;
}): TokenBlock[] => {
  const attachment = isTranscriptRecord(input.record.attachment)
    ? input.record.attachment
    : null;
  if (!attachment) return [];

  // the boot: one block per instructions file, labeled by its basename
  if (attachment.type === 'instructions') {
    const files = Array.isArray(attachment.files) ? attachment.files : [];
    return files.filter(isTranscriptRecord).map(
      (file) =>
        new TokenBlock({
          category: 'boot.instructions',
          label:
            typeof file.path === 'string'
              ? path.basename(file.path)
              : 'instructions',
          bytes: asByteCount({ value: file.content }),
        }),
    );
  }

  // a hook's payload: read `content` alone, since `stdout` repeats it
  if (
    typeof attachment.type === 'string' &&
    attachment.type.startsWith('hook_')
  )
    return [
      new TokenBlock({
        category: 'hook.output',
        label:
          typeof attachment.hookEvent === 'string'
            ? attachment.hookEvent
            : attachment.type,
        bytes: asByteCount({ value: attachment.content ?? attachment.stdout }),
      }),
    ];

  // every other attachment is a per-call harness reminder
  return [
    new TokenBlock({
      category: 'system.reminder',
      label:
        typeof attachment.type === 'string' ? attachment.type : 'attachment',
      bytes: asByteCount({ value: attachment }),
    }),
  ];
};

/**
 * .what = the utf-8 byte size of the text a value shows the model
 * .why = the byte share reads model-visible text; a string counts as itself, a list of
 *        text parts as their text, and any other shape as its json form
 */
const asByteCount = (input: { value: unknown }): number => {
  const { value } = input;
  if (value === undefined || value === null) return 0;
  if (typeof value === 'string') return Buffer.byteLength(value, 'utf8');
  if (Array.isArray(value))
    return value.reduce<number>(
      (sum, part) =>
        sum +
        asByteCount({
          value:
            isTranscriptRecord(part) && part.type === 'text' ? part.text : part,
        }),
      0,
    );
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
};
