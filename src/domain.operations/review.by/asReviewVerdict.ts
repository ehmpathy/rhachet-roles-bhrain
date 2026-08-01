import type { ReviewRun } from '../review/runOneReview';
import type { ReviewVerdict } from './ReviewByResult';

/**
 * .what = maps a runner result into the failhide-safe verdict
 * .why = keeps the outcome decode out of the orchestrator. the rules:
 *        - no detected verdict → malfunctioned (never a silent 0/0; carries the stderr reason)
 *        - a detected verdict with blockers → rejected
 *        - a detected verdict with no blockers → passed (nitpicks alone do not reject)
 *        see rule.forbid.failhide.
 */
export const asReviewVerdict = (input: { run: ReviewRun }): ReviewVerdict => {
  const { run } = input;

  // a run with no trustworthy tally is a malfunction — surface the reason, never a clean 0/0
  if (!run.detected)
    return {
      blockers: 0,
      nitpicks: 0,
      outcome: 'malfunctioned',
      tallier: null,
      reason: asMalfunctionReason({ run }),
    };

  // a detected verdict rejects on any blocker; nitpicks alone still pass
  const outcome = run.blockers > 0 ? 'rejected' : 'passed';
  return {
    blockers: run.blockers,
    nitpicks: run.nitpicks,
    outcome,
    tallier: run.tallier,
  };
};

/**
 * .what = extracts the first stderr line as the malfunction reason
 * .why = the runner already wrote a clean category reason to stderr; surface its first line so
 *        the human sees why, without the full dump.
 */
const asMalfunctionReason = (input: { run: ReviewRun }): string => {
  const firstLine = input.run.stderr
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line !== '');
  return firstLine ?? `review exited ${input.run.exitCode} with no verdict`;
};
