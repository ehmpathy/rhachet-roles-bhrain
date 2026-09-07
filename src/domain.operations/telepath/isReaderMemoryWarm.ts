/**
 * .what = how long a human's memory of the tree stays warm — 5 minutes, walltime
 * .why = the throttle is a model of the READER, never a guess at an annoyance threshold.
 *        the wisher named the quantity and the number in one line: *"that way its based
 *        on the expected cache-duration of the human's memory of the tree"* … *"5min,
 *        its warm. more than that? needs a refresh"* (seed S33)
 */
export const READER_MEMORY_WARM_MS = 5 * 60 * 1000;

/**
 * .what = does the human still hold the state, so a summary would tell them what they know?
 * .why = the nudge exists to refresh a reader who has gone cold. a reader who spoke a
 *        moment ago has not, so it costs them a screen and teaches them naught —
 *        measured 2026-09-06, it fired on three consecutive turns with the wisher present
 *
 * 🟡 the direction inverts the obvious throttle, and the inversion IS the design. a clock
 *    throttle suppresses when the NUDGE last fired; this suppresses when the HUMAN last
 *    spoke. so a long autonomous stretch — exactly when a reader has lost the thread —
 *    is what EARNS the summary rather than what makes it redundant
 */
export const isReaderMemoryWarm = (input: {
  spokeAt: Date | null;
  now: Date;
}): boolean => {
  // cannot tell → cold, so the nudge fires. an unreadable transcript must never be able
  // to silence the reminder, since a silent hook is indistinguishable from a happy one
  if (input.spokeAt === null) return false;

  const awayMs = input.now.getTime() - input.spokeAt.getTime();

  // a clock skew or a future-stamped entry reads as "just spoke" rather than as an
  // enormous absence — the safe read, since a negative age is a fault in the stamp
  if (awayMs < 0) return true;

  return awayMs < READER_MEMORY_WARM_MS;
};
