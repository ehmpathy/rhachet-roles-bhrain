import { createCache, type SimpleOnDiskCache } from 'simple-on-disk-cache';

import { asReviewWatermarkDir } from './asReviewWatermarkDir';

/**
 * .what = the caches this process opened, one per watermark dir
 * .why = a lock's isolation scope is a property of the cache instance, so one instance
 *        per dir is reused across every call in this process — a fresh cache per call
 *        is the "no lock at all" shape (rule.require.locks-via-with-simple-mutex). the
 *        on-disk tier still coordinates across processes, since its state is the dir
 *
 * .note = deliberate mutation of a module-scope memo: a map keyed by dir, written once
 *         per dir and never cleared
 */
const CACHE_BY_DIR = new Map<string, SimpleOnDiskCache>();

/**
 * .what = the on-disk cache that holds the review's watermarks and their mutex keys
 * .why = one per-machine store both for the watermark values and for the short holds
 *        that guard their read-check-write, so the two cannot drift apart
 *
 * .note = `expiration: null` — a watermark states a fact with its own instant inside it;
 *         the reader judges freshness from that instant, never from a cache ttl. the
 *         mutex sets its own lease as each lock entry's expiration
 */
export const getOneReviewWatermarkCache = (input: {
  cwd: string;
}): SimpleOnDiskCache => {
  const dir = asReviewWatermarkDir(input);
  const found = CACHE_BY_DIR.get(dir);
  if (found) return found;
  const cache = createCache({
    directory: { local: { path: dir } },
    expiration: null,
  });
  CACHE_BY_DIR.set(dir, cache);
  return cache;
};
