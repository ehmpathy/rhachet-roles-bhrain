import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';
import { setReviewWarmerRecord } from './setReviewWarmerRecord';

/**
 * .what = a warmer's last write: it stamps its record ended, so a round reads it gone
 *         at once rather than after its promised wake lapses
 * .why = the record names the warmer that last beat. a warmer that a later one took
 *        the name from must not end the record for it, so the stamp lands only where
 *        the pid is still this warmer's
 */
export const setReviewWarmerEnd = async (input: {
  cwd: string;
  reviewer: string;
  prefix: ReviewWarmerPrefix;
  pid: number;
  now: Date;
}): Promise<void> =>
  setReviewWarmerRecord({
    cwd: input.cwd,
    reviewer: input.reviewer,
    prefix: input.prefix,
    transit: (found) => ({
      next:
        found === null || found.pid !== input.pid
          ? null
          : { ...found, endedAt: input.now.toISOString() },
      result: undefined,
    }),
  });
