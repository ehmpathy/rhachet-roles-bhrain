/**
 * .what = the lane's one clock: when the lane began, and the bound its brain call may spend
 * .why = every step of a lane — scope, census, prime meet, each partition, each retry — runs
 *        inside one subprocess bound. so all of them read this one shape, and the residual
 *        is derived in one place (`getOneReviewBrainCallResidualMs`, `isReviewBoundSpent`)
 *        rather than by a subtraction at each call site
 *
 * .note = `msOfReviewStart` is when the LANE began, never when a partition or a retry began
 */
export type ReviewLaneClock = {
  msOfReviewStart: number;
  brainCallTimeoutMs: number;
};
