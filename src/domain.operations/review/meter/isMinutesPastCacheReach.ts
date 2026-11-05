import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';

/**
 * .what = whether a gap of minutes has passed the cache reach
 * .why = 🔴 one comparator, so the lane grade and the pair verdict cannot read one gap two
 *        ways: at exactly the reach, both say the prefix is gone (`lapsed`)
 *
 * .note = an unread gap (null) proves no lapse, so it reads false — the zero stays a miss
 */
export const isMinutesPastCacheReach = (input: {
  minutes: number | null;
}): boolean =>
  input.minutes !== null && input.minutes >= MINUTES_OF_CACHE_REACH;
