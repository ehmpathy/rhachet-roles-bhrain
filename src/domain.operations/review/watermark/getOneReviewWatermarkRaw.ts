import { MalfunctionError } from 'helpful-errors';
import { isSimpleCacheConditionError } from 'simple-on-disk-cache';

import { getOneReviewWatermarkCache } from './getOneReviewWatermarkCache';

/**
 * .what = the attempts a physical read makes before it concludes the key churned too fast
 * .why = a read races only a write that lands between its version probe and its
 *        conditional get; a handful of retries outlasts any honest writer
 */
const ATTEMPTS_OF_PHYSICAL_READ = 8;

/**
 * .what = read one watermark's raw value straight from its entry on disk
 * .why = a plain `get` consults the cache's valid-keys index, and that index can lose a
 *        registration when two processes write at once — so a watermark another process
 *        just wrote can read as absent. `version` then a get conditioned on that version
 *        reads the physical entry, which is the truth a watermark must be read from
 *
 * .note = a condition miss means a write landed between the two calls; the read retries
 *         with the fresh version, bounded, then fails loud
 */
export const getOneReviewWatermarkRaw = async (input: {
  cwd: string;
  key: string;
}): Promise<string | null> => {
  const cache = getOneReviewWatermarkCache({ cwd: input.cwd });
  const attempts = Array.from({ length: ATTEMPTS_OF_PHYSICAL_READ });
  for (const _ of attempts) {
    // probe the physical version; absent means no watermark yet
    const version = await cache.version(input.key);
    if (version === undefined) return null;

    // read the entry at that exact version; a miss means a writer raced us
    try {
      const raw = await cache.get(input.key, { condition: { version } });
      return raw ?? null;
    } catch (error) {
      if (!isSimpleCacheConditionError(error)) throw error;
    }
  }
  throw new MalfunctionError(
    'getOneReviewWatermarkRaw: the watermark changed on every read',
    { key: input.key, attempts: ATTEMPTS_OF_PHYSICAL_READ },
  );
};
