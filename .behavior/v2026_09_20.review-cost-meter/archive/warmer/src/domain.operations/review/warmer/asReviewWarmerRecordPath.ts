import * as path from 'path';

import { DIR_OF_REVIEW_WATERMARKS } from '@src/domain.operations/review/watermark/asReviewWatermarkDir';

import { asReviewWarmerRecordKey } from './asReviewWarmerRecordKey';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';

/**
 * .what = the repo-relative path of one prefix's warmer record on disk
 * .why = a warmer records its own pid there at its first beat, so a driver who must
 *        stop a warmer whose pid this round could not yet print reads it from this
 *        file — no paid review re-run to learn one number (rule.require.errors-name-the-fix)
 *
 * .note = the on-disk cache writes each entry at `<dir>/<key>`, so the path is the
 *         watermark dir joined with the record's key. relative, since a review runs
 *         from the repo root and the driver reads it from there
 */
export const asReviewWarmerRecordPath = (input: {
  reviewer: string;
  prefix: ReviewWarmerPrefix;
}): string =>
  path.join(DIR_OF_REVIEW_WATERMARKS, asReviewWarmerRecordKey(input));
