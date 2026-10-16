import type { ReviewRun } from '@src/domain.operations/review/runOneReview';

/**
 * .what = the review run of a review that never started, because a precondition faulted
 * .why = the runner OWNS what a malfunction run is — a nonzero exit, no verdict detected,
 *        no tally — so a caller whose precondition faulted asks the runner's side for that
 *        shape rather than copy its conventions. a change to how the runner marks a
 *        malfunction then lands here, beside it, and reaches every caller at once
 */
export const asReviewRunOfPreconditionFault = (input: {
  reason: string;
}): ReviewRun => ({
  stdout: '',
  stderr: input.reason,
  exitCode: 1,
  durationMs: null,
  blockers: 0,
  nitpicks: 0,
  tallier: null,
  talliedBy: null,
  detected: false,
});
