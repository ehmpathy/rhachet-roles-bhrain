import * as path from 'path';
import { createCache, type SimpleOnDiskCache } from 'simple-on-disk-cache';

/**
 * .what = the caches this process opened, one per repo
 * .why = a lock's isolation scope is the cache instance, so one instance per repo is
 *        reused across calls; a fresh cache per call is no lock at all
 *        (rule.require.locks-via-with-simple-mutex)
 *
 * .note = deliberate mutation of a module-scope memo: a map keyed by dir, written once
 *         per dir and never cleared
 */
const CACHE_BY_DIR = new Map<string, SimpleOnDiskCache>();

/**
 * .what = the on-disk cache that holds the bind-swap mutex keys
 * .why = push and pop run as separate processes, so the one place they meet is the disk
 */
export const getOneRouteBindSwapCache = (input: {
  repoRoot: string;
}): SimpleOnDiskCache => {
  const dir = path.join(
    input.repoRoot,
    '.agent',
    '.cache',
    'repo=bhrain',
    'role=learner',
    'skill=education',
    'bind.swap',
  );
  const found = CACHE_BY_DIR.get(dir);
  if (found) return found;
  const cache = createCache({
    directory: { local: { path: dir } },
    expiration: null,
  });
  CACHE_BY_DIR.set(dir, cache);
  return cache;
};
