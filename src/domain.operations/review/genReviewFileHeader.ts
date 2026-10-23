import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asReviewOutcome } from './asReviewOutcome';

/**
 * .what = the phrase the review file opens with, per outcome
 * .why = a file records, where stdout greets; so the words may differ, but the grade
 *        behind them comes from `asReviewOutcome`, which stdout reads too
 */
const PHRASE_OF_OUTCOME: Record<ReturnType<typeof asReviewOutcome>, string> = {
  blocked: '🦉 needs your talons',
  nitpicked: '🦉 just a few hoots',
  clear: '✨ all clear',
};

/**
 * .what = the summary block a review FILE opens with, above the formatted review
 * .why = it sat inline in `stepReview` as an IIFE that chose an icon, suffixed two
 *        counts, and joined an array — three decisions a reader had to simulate
 *        mid-orchestrator to learn what the file's first bytes would be
 *        (`rule.forbid.decode-friction-in-orchestrators`).
 *
 * .note = a peer of `genReviewOutputStdout`, never a copy — stdout greets a
 *         human at a terminal, the file header is a durable record a later
 *         reader greps. both take the same two counts and neither derives its
 *         own, so the two must not differ on the arithmetic
 */
export const genReviewFileHeader = (input: {
  paths: {
    logsRelative: string;
    reviewRelative: string;
  };
  summary: {
    blockersCount: number;
    nitpicksCount: number;
  };
}): string => {
  // the grade is shared with stdout; only the phrase is the file's own
  const owlHeader = PHRASE_OF_OUTCOME[asReviewOutcome(input.summary)];

  // a count of zero carries no marker — a 🔴 beside `0 blockers` reads as an alarm
  const blockerEmoji = input.summary.blockersCount > 0 ? ' 🔴' : '';
  const nitpickEmoji = input.summary.nitpicksCount > 0 ? ' 🟠' : '';

  return [
    owlHeader,
    `   ├─ logs: ${input.paths.logsRelative}`,
    `   ├─ review: ${input.paths.reviewRelative}`,
    `   └─ summary`,
    `      ├─ ${asCountedNoun({ count: input.summary.blockersCount, one: 'blocker', many: 'blockers' })}${blockerEmoji}`,
    `      └─ ${asCountedNoun({ count: input.summary.nitpicksCount, one: 'nitpick', many: 'nitpicks' })}${nitpickEmoji}`,
    '',
    '---',
    '',
  ].join('\n');
};
