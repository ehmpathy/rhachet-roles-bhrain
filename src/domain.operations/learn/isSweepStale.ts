/**
 * .what = the staleness threshold for the domain-term sweep — 1 hour, walltime
 * .why = fixed for now per the wish (not configurable); a good round of work
 *        deserves a distillation, and an hour is the human's natural pause
 */
export const SWEEP_STALENESS_THRESHOLD_MS = 60 * 60 * 1000;

/**
 * .what = decide whether the domain-term distillation has gone stale
 * .why = the onStop hook nudges only when stale. staleness turns on TWO signals so a
 *        bare `touch` cannot silence the nudge: (1) an absent sentinel (null mtime) or
 *        (2) a present-but-unarticulated sentinel (empty / trivially short) both count
 *        as stale — fail toward the reminder, never toward silence. only a RECENT AND
 *        ARTICULATED distillation lets the session rest, which makes the wish's one
 *        hard requirement (articulate what you distilled + why) real, not bypassable
 */
export const isSweepStale = (input: {
  mtime: Date | null;
  articulated: boolean;
  now: Date;
}): boolean => {
  // absent sentinel → stale (first run has no distillation yet)
  if (input.mtime === null) return true;

  // present but not a real articulation (empty / bare touch) → stale: the nudge holds
  // until the learner truly distills (guards the wish's one hard requirement)
  if (!input.articulated) return true;

  // stale once the distillation is older than the threshold
  const ageMs = input.now.getTime() - input.mtime.getTime();
  return ageMs > SWEEP_STALENESS_THRESHOLD_MS;
};
