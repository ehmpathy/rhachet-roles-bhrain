/**
 * .what = the minutes from the prior round's last send to this round's mint — null where
 *         the mint gap is unread
 * .why = a cache entry's reach runs from the last request that touched it, and a run touches
 *        its prefix until its brain call ends (a multi-turn call re-reads it each turn). a gap
 *        from mint to mint counts the prior's own call as idle time, so a pair a few minutes
 *        past the reach would grade `lapsed` while the cache may still have held it
 *
 * .note = the prior's end is its mint plus its brain wall time, the LATEST it could have
 *         touched the prefix. so the gap is the shortest the record allows, and it leans to
 *         `missed` — a zero read is never bought an excuse by a long prior
 *         (`getAllLaneOrdinals` holds the same bias)
 * .note = a prior with no wall time on record (an unmetered run) keeps the mint gap; naught
 *         better is known of it
 */
export const getOneMinutesSincePriorSend = (input: {
  /** the minutes from the prior's mint to this round's — null where either stamp is unread */
  minutesBetweenMints: number | null;
  /** the prior's brain wall time, in minutes — null where the prior was not metered */
  minutesOfPriorCall: number | null;
}): number | null => {
  if (input.minutesBetweenMints === null) return null;
  if (input.minutesOfPriorCall === null) return input.minutesBetweenMints;
  return Math.max(0, input.minutesBetweenMints - input.minutesOfPriorCall);
};
