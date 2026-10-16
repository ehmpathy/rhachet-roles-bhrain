import { asReviewWatermarkJson } from '@src/domain.operations/review/watermark/asReviewWatermarkJson';
import { getOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/getOneReviewWatermarkRaw';

import type { PrimeWatermark } from './PrimeWatermark';

/**
 * .what = the meet watermark, or null where none was written yet
 *
 * .note = a valid-json edit of the wrong shape reads as absent fields; bytes that are not json
 *         throw a `ReviewWatermarkParseError` that names the key — a store fault, so the meet
 *         pours cold and names it on stderr, never fails the review
 */
export const getOnePrimeWatermark = async (input: {
  meet: { cwd: string; key: string };
}): Promise<PrimeWatermark | null> => {
  const raw = await getOneReviewWatermarkRaw(input.meet);
  if (raw === null) return null;
  return asReviewWatermarkJson<PrimeWatermark>({ raw, ...input.meet });
};
