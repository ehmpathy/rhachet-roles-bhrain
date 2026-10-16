import { setOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/setOneReviewWatermarkRaw';
import { withReviewWatermarkHold } from '@src/domain.operations/review/watermark/withReviewWatermarkHold';

import { asReviewWarmerReviewerKey } from './asReviewWarmerReviewerKey';
import { getOneReviewWarmerLane } from './getOneReviewWarmerLane';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';

/**
 * .what = records the prefix this reviewer's lane now sends, and answers the one it
 *         replaced
 * .why = a new round may send a new head or a new brain. once it says so here, every
 *        warmer of the old prefix reads at its next wake that its work is no longer
 *        wanted, and exits — no round reaches into another process to stop it
 *
 * .note = one short hold spans the read and the write, so the prior a round answers is
 *         the one its own write replaced, never a peer's
 */
export const setReviewWarmerLane = async (input: {
  cwd: string;
  reviewer: string;
  lane: ReviewWarmerPrefix;
}): Promise<{ prior: ReviewWarmerPrefix | null }> =>
  withReviewWatermarkHold(
    { cwd: input.cwd, key: asReviewWarmerReviewerKey(input) },
    async () => {
      const prior = await getOneReviewWarmerLane(input);
      await setOneReviewWatermarkRaw({
        cwd: input.cwd,
        key: asReviewWarmerReviewerKey(input),
        raw: JSON.stringify(input.lane),
      });
      return { prior };
    },
  );
