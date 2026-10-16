/**
 * .what = the clock a warmer's cadence runs on
 * .why = the cadence IS the product here — the reach decays with the gap
 *        (`CENSUS_OF_CACHE_REACH`), so when a warmer wakes is the whole lever. a
 *        schedule welded to `setTimeout` and `new Date()` can only be exercised
 *        by a suite that waits out its own cadence, which means the two decisions
 *        that matter — the DEFER on a fresh review, and that a defer does not
 *        advance the counter — are unclamped at the grain where they meet
 *        (rule.forbid.time-assumptions).
 *
 * .note = a fake clock whose `sleep` advances its own `now` reproduces the real
 *         one's sequence exactly, at zero wall time
 */
export interface WarmerClock {
  /** the instant, as this warmer reckons it */
  now: () => Date;
  /** waits out `minutes` of this warmer's cadence */
  sleep: (minutes: number) => Promise<void>;
}

/**
 * .what = the real clock — wall time, and a real wait
 * .why = declared beside the interface so the production call site is one import
 *        rather than two lambdas re-typed at the seam
 */
export const CLOCK_OF_WALL: WarmerClock = {
  now: () => new Date(),
  sleep: (minutes) => new Promise((done) => setTimeout(done, minutes * 60_000)),
};
