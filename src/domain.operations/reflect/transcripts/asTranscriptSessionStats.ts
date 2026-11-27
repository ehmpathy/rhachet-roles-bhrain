import { asQueuedHumanPromptText } from '@src/domain.operations/transcript/asQueuedHumanPromptText';
import { isHumanTurn } from '@src/domain.operations/transcript/isHumanTurn';

/**
 * .what = the stats of one session transcript: entry count, first and last activity, and
 *         its human prompts, the last one with its text
 * .why = "which session did i speak to last?" is answered by the last human prompt, not the
 *        last write: a clone at work writes its transcript long after the human went quiet
 */
export type TranscriptSessionStats = {
  entries: number;
  since: string | null;
  until: string | null;
  prompts: number;
  promptLast: { at: string; text: string } | null;
};

/**
 * .what = the typed text of a human turn, flattened to one string
 * .why = a human turn holds a bare string or an array of text blocks
 */
const asHumanTurnText = (entry: {
  message?: { content?: unknown };
}): string => {
  const content = entry.message?.content;
  if (typeof content === 'string') return content.trim();
  if (!Array.isArray(content)) return '';
  return content
    .filter((block: { type?: unknown }) => block?.type === 'text')
    .map((block: { text?: unknown }) => String(block.text ?? ''))
    .join(' ')
    .trim();
};

/**
 * .what = the text of a human prompt, '' for a human turn with no typed text, or null when
 *         the entry is no human prompt at all
 * .why = a human speaks two ways: a turn they open (`isHumanTurn`) and a message they send
 *        mid-turn (`asQueuedHumanPromptText`); both count, or a talkative human reads as silent
 */
const asHumanPromptText = (entry: Record<string, unknown>): string | null => {
  if (isHumanTurn(entry)) return asHumanTurnText(entry);
  return asQueuedHumanPromptText(entry);
};

/**
 * .what = folds a transcript's entries into its session stats
 * .why = one pure pass, so the read of the file and the rule of what counts stay apart
 * .note = an entry with no timestamp still counts, but cannot be last
 */
export const asTranscriptSessionStats = (input: {
  entries: Record<string, unknown>[];
}): TranscriptSessionStats =>
  input.entries.reduce<TranscriptSessionStats>(
    (stats, entry) => {
      const at = typeof entry.timestamp === 'string' ? entry.timestamp : null;
      const since = at && (!stats.since || at < stats.since) ? at : stats.since;
      const until = at && (!stats.until || at > stats.until) ? at : stats.until;
      const text = asHumanPromptText(entry);
      const isPromptLast =
        !!text && !!at && (!stats.promptLast || at >= stats.promptLast.at);
      return {
        entries: stats.entries + 1,
        since,
        until,
        prompts: stats.prompts + (text === null ? 0 : 1),
        promptLast:
          isPromptLast && at && text ? { at, text } : stats.promptLast,
      };
    },
    { entries: 0, since: null, until: null, prompts: 0, promptLast: null },
  );
