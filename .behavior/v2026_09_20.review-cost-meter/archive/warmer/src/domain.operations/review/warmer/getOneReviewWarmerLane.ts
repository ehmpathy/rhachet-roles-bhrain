import { asReviewWatermarkJson } from '@src/domain.operations/review/watermark/asReviewWatermarkJson';
import { getOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/getOneReviewWatermarkRaw';

import { asReviewWarmerReviewerKey } from './asReviewWarmerReviewerKey';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';

/**
 * .what = the prefix this reviewer's lane sends now, as its latest round recorded it
 * .why = a warmer reads it at each wake: a prefix no longer current is a prefix no
 *        later round reads, so its warmer exits rather than spend on it
 */
export const getOneReviewWarmerLane = async (input: {
  cwd: string;
  reviewer: string;
}): Promise<ReviewWarmerPrefix | null> => {
  const key = asReviewWarmerReviewerKey(input);
  const raw = await getOneReviewWatermarkRaw({ cwd: input.cwd, key });
  if (raw === null) return null;

  // a valid-json edit of the wrong shape reads as absent fields; bytes that are not json
  // fail loud as a `ReviewWatermarkParseError` that names the key and its dir
  return asReviewWatermarkJson<ReviewWarmerPrefix>({
    raw,
    key,
    cwd: input.cwd,
  });
};
