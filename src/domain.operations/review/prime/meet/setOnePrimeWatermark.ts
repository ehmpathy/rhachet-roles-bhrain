import { setOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/setOneReviewWatermarkRaw';

import type { PrimeWatermark } from './PrimeWatermark';

/**
 * .what = writes the meet watermark
 *
 * .note = call it only inside `withReviewWatermarkHold` on the same key, so the write is the
 *         last step of one read-check-write no other lane can interleave
 */
export const setOnePrimeWatermark = async (input: {
  meet: { cwd: string; key: string };
  watermark: PrimeWatermark;
}): Promise<void> =>
  setOneReviewWatermarkRaw({
    ...input.meet,
    raw: JSON.stringify(input.watermark),
  });
