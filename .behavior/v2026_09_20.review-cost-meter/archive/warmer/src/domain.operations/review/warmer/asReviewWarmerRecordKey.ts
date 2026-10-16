import { asReviewWatermarkKey } from '@src/domain.operations/review/watermark/asReviewWatermarkKey';

import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';

/**
 * .what = the watermark key of one prefix's warmer record
 * .why = keyed on the reviewer AND the prefix: two prefixes of one lane are two caches,
 *        so each has its own last-poked-at, and a warmer of the old one never reads the
 *        new one's pokes as its own
 */
export const asReviewWarmerRecordKey = (input: {
  reviewer: string;
  prefix: ReviewWarmerPrefix;
}): string =>
  asReviewWatermarkKey({
    kind: 'warmer-prefix',
    of: [input.reviewer, input.prefix.head ?? '', input.prefix.brain],
  });
