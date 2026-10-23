import type { ReviewLaneClock } from '@src/domain.objects/Reviewer/ReviewLaneClock';

/**
 * .what = the share of the lane's bound left for the brain call, as of `msOfNow`
 * .why = the bound covers the whole review, never the brain call alone. the work ahead of
 *        the call — scope, census, and the prime meet, which may wait up to two minutes — runs
 *        on the same clock as the subprocess kill above it. a bound that restarts at the call
 *        lets that work push the call past the outer kill, so the subprocess dies dirty and its
 *        clean `ReviewTimeoutError` never shows (measured 2026-10-07: a lane killed at 21
 *        minutes, its inner 20-minute bound still open)
 * .note = floored at 1ms, since a bound of zero would fire at once. a review whose prior work
 *         already spent the whole bound times out at once, cleanly, which is the honest outcome
 * .note = it takes the lane's clock whole, so no caller subtracts the start itself
 */
export const getOneReviewBrainCallResidualMs = (input: {
  clock: ReviewLaneClock;
  msOfNow: number;
}): number =>
  Math.max(
    1,
    input.clock.brainCallTimeoutMs -
      Math.max(0, input.msOfNow - input.clock.msOfReviewStart),
  );
