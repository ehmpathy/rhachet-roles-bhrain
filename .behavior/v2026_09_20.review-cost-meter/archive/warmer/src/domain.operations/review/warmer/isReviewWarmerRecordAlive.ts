import { getOneMinutesElapsed } from './getOneMinutesElapsed';
import type { ReviewWarmerRecord } from './ReviewWarmerRecord';

/**
 * .what = the minutes past its promised wake a warmer may run late before it reads dead
 * .why = a wake lands a little after its instant — a timer drifts, a disk is slow —
 *        so a warmer one minute late is alive, while a warmer that crashed misses its
 *        wake by a whole cadence. two minutes parts the two
 */
export const MINUTES_OF_WARMER_GRACE = 2;

/**
 * .what = whether a warmer record names a warmer that is still awake
 * .why = liveness is read from STATE the warmer itself keeps current — it beats a new
 *        `wakeBy` at every wake, and stamps `endedAt` on exit — never from a pid probe,
 *        which a recycled pid fools (rule.forbid.hand-rolled-locks)
 *
 * .note = a warmer that crashed stops to beat, so its record lapses within one cadence
 *         plus the grace; no reaper is owed
 */
export const isReviewWarmerRecordAlive = (input: {
  record: ReviewWarmerRecord | null;
  now: Date;
}): boolean => {
  if (input.record === null) return false;
  if (input.record.endedAt !== null) return false;

  // a garbled `wakeBy` stamp reads as not alive — the fail-safe, respawn direction, named
  // here rather than left to a `NaN` compare that never reads true
  const wakeBy = new Date(input.record.wakeBy);
  if (Number.isNaN(wakeBy.getTime())) return false;

  // alive while no later than its promised wake plus the grace
  const lateMinutes = getOneMinutesElapsed({
    since: wakeBy,
    until: input.now,
  });
  return lateMinutes <= MINUTES_OF_WARMER_GRACE;
};
