import { getOneReviewWarmerLane } from './getOneReviewWarmerLane';
import { getOneReviewWarmerRecord } from './getOneReviewWarmerRecord';
import { isReviewWarmerRecordAlive } from './isReviewWarmerRecordAlive';
import type {
  ReviewWarmerPrefix,
  ReviewWarmerRecord,
} from './ReviewWarmerRecord';

/**
 * .what = the record of the warmer awake for this reviewer's current prefix, with that
 *         prefix, or null where none is awake
 * .why = a round that spawns no warmer (`--warmer off`) still owes the driver word of a
 *        spender an earlier round left awake. the lane names the prefix; the prefix's
 *        record names the warmer, its pid, and whether it still beats. the prefix rides
 *        along since it addresses the record a driver reads a not-yet-printed pid from
 *
 * .note = a warmer of an OLDER prefix is not reported: it reads at its next wake that
 *         the lane moved on, and exits on its own
 */
export const getOneReviewWarmerLive = async (input: {
  cwd: string;
  reviewer: string;
  now: Date;
}): Promise<{
  record: ReviewWarmerRecord;
  prefix: ReviewWarmerPrefix;
} | null> => {
  const prefix = await getOneReviewWarmerLane(input);
  if (prefix === null) return null;
  const record = await getOneReviewWarmerRecord({ ...input, prefix });
  if (record === null) return null;
  if (!isReviewWarmerRecordAlive({ record, now: input.now })) return null;
  return { record, prefix };
};
