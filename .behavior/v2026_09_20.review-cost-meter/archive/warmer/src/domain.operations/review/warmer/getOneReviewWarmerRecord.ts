import { asReviewWatermarkJson } from '@src/domain.operations/review/watermark/asReviewWatermarkJson';
import { getOneReviewWatermarkRaw } from '@src/domain.operations/review/watermark/getOneReviewWatermarkRaw';

import { asReviewWarmerRecordKey } from './asReviewWarmerRecordKey';
import type {
  ReviewWarmerPrefix,
  ReviewWarmerRecord,
} from './ReviewWarmerRecord';

/**
 * .what = the warmer record of one prefix, or null where none was written
 * .why = read with no hold: a reader that only reports — `--warmer off`, a render —
 *        acts on no decision a peer could race
 */
export const getOneReviewWarmerRecord = async (input: {
  cwd: string;
  reviewer: string;
  prefix: ReviewWarmerPrefix;
}): Promise<ReviewWarmerRecord | null> => {
  const key = asReviewWarmerRecordKey(input);
  const raw = await getOneReviewWatermarkRaw({ cwd: input.cwd, key });
  if (raw === null) return null;

  // a valid-json edit of the wrong shape reads as absent fields; bytes that are not json
  // fail loud as a `ReviewWatermarkParseError` that names the key and its dir
  return asReviewWatermarkJson<ReviewWarmerRecord>({
    raw,
    key,
    cwd: input.cwd,
  });
};
