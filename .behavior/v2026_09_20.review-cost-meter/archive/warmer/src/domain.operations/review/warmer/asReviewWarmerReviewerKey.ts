import { asReviewWatermarkKey } from '@src/domain.operations/review/watermark/asReviewWatermarkKey';

/**
 * .what = the watermark key of one reviewer's warmer record
 * .why = one home for the key, so the read and the write cannot drift apart
 *
 * .note = keyed by `reviewer` alone — never a lane in the `asReviewLaneKey` sense
 *         (root, slug, head, brain). the record it addresses holds the prefix the
 *         reviewer's lane now sends, so the head and brain are its VALUE, not its key
 *
 * .note = the `'warmer-lane'` kind stays as is: it is the on-disk prefix of the
 *         watermark file (`asReviewWatermarkKey`). a warmer spawned by a prior build
 *         reads the old key, so a renamed kind would orphan its record and it would
 *         never learn its prefix was replaced
 */
export const asReviewWarmerReviewerKey = (input: {
  reviewer: string;
}): string =>
  asReviewWatermarkKey({ kind: 'warmer-lane', of: [input.reviewer] });
