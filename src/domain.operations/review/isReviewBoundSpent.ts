import type { ReviewLaneClock } from '@src/domain.objects/Reviewer/ReviewLaneClock';

/**
 * .what = whether a review's brain call bound is spent, as of `msOfNow`
 * .why = a new ask is worth a start only while the lane's bound has time left. a retry that
 *        starts past it would time out at once — yet it still mints a run, and may bill an
 *        ask the deadline then abandons. so a caller about to start new work asks this first
 *
 * .note = the clock is the LANE's: `msOfReviewStart` is when the lane began, never when a
 *         partition or a retry began, since all of them share one subprocess bound
 */
export const isReviewBoundSpent = (input: {
  clock: ReviewLaneClock;
  msOfNow: number;
}): boolean =>
  input.msOfNow - input.clock.msOfReviewStart >= input.clock.brainCallTimeoutMs;
