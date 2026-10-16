import { createHash } from 'crypto';

/**
 * .what = the cache key of one watermark — its kind, then a digest of what it is keyed on
 * .why = an on-disk cache key admits only `[a-zA-Z0-9._-]`, while a reviewer slug or a
 *        prompt head may hold any byte. the digest keeps the key safe and fixed in size;
 *        the kind keeps it legible to a human who lists the dir at 3am
 *
 * .note = the NUL separator keeps the parts apart, so no split of the bytes collides
 *         with another
 */
export const asReviewWatermarkKey = (input: {
  kind: 'prime';
  of: string[];
}): string =>
  `${input.kind}.${createHash('sha256')
    .update(input.of.join('\0'))
    .digest('hex')
    .slice(0, 32)}`;
