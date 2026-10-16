import { getOneReviewWatermarkCache } from './getOneReviewWatermarkCache';

/**
 * .what = write one watermark's raw value
 * .why = a watermark carries its own instant, so it never expires by ttl; the reader
 *        judges its freshness from that instant
 *
 * .note = call it only inside `withReviewWatermarkHold` on the same key, so the write is
 *         the last step of one read-check-write that no other process can interleave
 */
export const setOneReviewWatermarkRaw = async (input: {
  cwd: string;
  key: string;
  raw: string;
}): Promise<void> => {
  const cache = getOneReviewWatermarkCache({ cwd: input.cwd });
  await cache.set(input.key, input.raw, { expiration: null });
};
