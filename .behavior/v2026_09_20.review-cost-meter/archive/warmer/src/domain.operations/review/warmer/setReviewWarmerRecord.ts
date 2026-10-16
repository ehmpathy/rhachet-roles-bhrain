import { setOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/setOneReviewWatermarkRaw';
import { withReviewWatermarkHold } from '@src/domain.operations/review/watermark/withReviewWatermarkHold';

import { asReviewWarmerRecordKey } from './asReviewWarmerRecordKey';
import { getOneReviewWarmerRecord } from './getOneReviewWarmerRecord';
import type {
  ReviewWarmerPrefix,
  ReviewWarmerRecord,
} from './ReviewWarmerRecord';

/**
 * .what = one transition of a prefix's warmer record — read it, decide, write the next
 *         state — under a short hold on that prefix
 * .why = every warmer decision another process could race is one such transition: a
 *        round that finds a live warmer or spawns one, a warmer that claims a poke, a
 *        beat, an exit. the hold spans the read and the write and naught else; the
 *        spawn and the poke run outside it (rule.require.locks-via-with-simple-mutex)
 *
 * .note = `transit` is pure: it sees the record found, and names the record to write
 *         (null to write naught) and what to answer. it must do no i/o, since it runs
 *         inside the hold
 */
export const setReviewWarmerRecord = async <T>(input: {
  cwd: string;
  reviewer: string;
  prefix: ReviewWarmerPrefix;
  transit: (found: ReviewWarmerRecord | null) => {
    next: ReviewWarmerRecord | null;
    result: T;
  };
}): Promise<T> =>
  withReviewWatermarkHold(
    { cwd: input.cwd, key: asReviewWarmerRecordKey(input) },
    async () => {
      const found = await getOneReviewWarmerRecord(input);
      const { next, result } = input.transit(found);
      if (next !== null)
        await setOneReviewWatermarkRaw({
          cwd: input.cwd,
          key: asReviewWarmerRecordKey(input),
          raw: JSON.stringify(next),
        });
      return result;
    },
  );
