import type { ReviewWarmerRecord } from './ReviewWarmerRecord';

/**
 * .what = whether a prefix's warmer record names a pid other than the asker's own
 * .why = the last warmer to boot names the record's pid, and the stop line prints that
 *        pid as THE command that stops the spend. a warmer the record does not name is a
 *        warmer no printed `kill` can reach, so it must not keep a poke loop alive
 *
 * .note = an unrecorded pid names no one, so it displaces no one: a fresh record awaits
 *         its child's first beat, and every warmer reads it as its own
 */
export const isReviewWarmerRecordOfAnotherPid = (input: {
  record: ReviewWarmerRecord | null;
  pid: number;
}): boolean => {
  if (input.record === null) return false;
  if (input.record.pid === null) return false;
  return input.record.pid !== input.pid;
};
