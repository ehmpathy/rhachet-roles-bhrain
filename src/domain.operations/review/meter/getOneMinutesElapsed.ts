/**
 * .what = how many minutes lie between two instants
 * .why = the lane grade turns on one quantity — how long since this lane's
 *        prefix was last sent — compared against `MINUTES_OF_CACHE_REACH`.
 *        one named transformer keeps the `/ 60_000` out of the orchestrator
 *        (rule.forbid.inline-decode-friction) and out of hand-rolled ms math
 *        (rule.forbid.any-time)
 *
 * .note = it answers a `number` of minutes rather than an `IsoDuration`, since
 *         the bound it meets (`MINUTES_OF_CACHE_REACH`) and the lapse it renders
 *         both speak minutes; a duration here would cost a cast at each seam
 *
 * .note = it answers a fraction and does not round. the round belongs at the
 *         render, so a lapse a hair past the reach never reads as within it
 */
export const getOneMinutesElapsed = (input: {
  since: Date;
  until: Date;
}): number => (input.until.getTime() - input.since.getTime()) / 60_000;
