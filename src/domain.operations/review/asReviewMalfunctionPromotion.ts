import { REVIEWER_OUTPUT_CONTRACT_BRIEF } from './REVIEWER_OUTPUT_CONTRACT_BRIEF';

/**
 * .what = promotes a "successful" review to malfunction when it yields no trustworthy verdict
 * .why = a review that exits 0 but declares no numeric blocker/nitpick count — and whose prose
 *        the sub-brain also could not tally — cannot be trusted as "approved": a silent 0/0
 *        would look like a clean review when in truth no review was read (rule.forbid.failhide).
 *        the brain-error reason, if any, takes precedence, so a human can tell a brain fault
 *        apart from an odd phrase the regex missed
 * .note = any other run passes through untouched
 */
export const asReviewMalfunctionPromotion = (input: {
  exitCode: number;
  stderr: string;
  detected: boolean;
  brainErrorReason: string | null;
}): { exitCode: number; stderr: string } => {
  // a run with a verdict, or one that already failed, keeps its own exit and stderr
  if (input.exitCode !== 0 || input.detected)
    return { exitCode: input.exitCode, stderr: input.stderr };

  // an exit-0 run with no readable verdict blocks as a malfunction, with its reason appended
  const reason =
    input.brainErrorReason ??
    '💥 MalfunctionError: reviewer output lacks a numeric blocker/nitpick count ' +
      '(expected `N blockers` and `N nitpicks`; use `0 blockers` / `0 nitpicks` to declare clean). ' +
      `see ${REVIEWER_OUTPUT_CONTRACT_BRIEF}`;
  return {
    exitCode: 1,
    stderr: [input.stderr, reason].filter((line) => line !== '').join('\n'),
  };
};
