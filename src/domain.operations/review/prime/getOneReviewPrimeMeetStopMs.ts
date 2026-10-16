/**
 * .what = the epoch-ms instant past which a lane's prime meet must stop to wait: half the
 *         review's bound, measured from when the review began
 * .why = 🔴 the meet and the brain call share one clock (`getOneReviewBrainCallResidualMs`).
 *        a meet that waits on a wedged or crashed primer would otherwise spend the bound and
 *        leave the brain call a residual of 1ms, so a cache optimization would time out the
 *        review it was meant to speed. the brain call keeps at least half the bound, whatever
 *        the meet meets (rule.forbid.cold-pour-of-a-shared-prefix: a prime is never a gate)
 *
 * .note = half is a share, never a fixed reserve: at the default 21-minute bound the meet's own
 *         windows (two minutes at most) never reach it, so it changes naught there; at a bound a
 *         human set short, the meet shrinks with it, and at a bound shorter than the work ahead
 *         of the meet, the meet takes no time at all
 */
export const getOneReviewPrimeMeetStopMs = (input: {
  msOfReviewStart: number;
  brainCallTimeoutMs: number;
}): number => input.msOfReviewStart + Math.floor(input.brainCallTimeoutMs / 2);
