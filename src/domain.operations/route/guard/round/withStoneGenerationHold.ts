import * as os from 'os';
import * as path from 'path';
import { createCache } from 'simple-on-disk-cache';
import { withSimpleMutex } from 'with-simple-mutex';

/**
 * .what = the one machine-wide cache every stone generation hold claims its key in
 * .why = a mutex's isolation scope is its cache INSTANCE, so it is built once, here, at
 *        module scope. a cache built per call would hand each caller its own empty store,
 *        and every acquire would win at once (rule.require.locks-via-with-simple-mutex)
 *
 * .note = per-machine scope: a guard round and a rewind of one route always run on one
 *         machine, as two processes of one user, so os.tmpdir() is the dir both read
 */
const STONE_GENERATION_MUTEX_CACHE = createCache({
  directory: {
    local: {
      path: path.join(os.tmpdir(), 'rhachet-roles-bhrain', 'mutex'),
    },
  },
});

/**
 * .what = the lock key of one stone of one route
 * .why = a relative route and its absolute twin must claim one key, so the key carries
 *        the route as an absolute path (`path.relative('/', …)` expands a relative path
 *        against cwd and drops the root slash)
 */
const asStoneGenerationMutexKey = (input: {
  route: string;
  stone: string;
}): string =>
  `stone-generation.${path.relative('/', input.route)}.${input.stone}`;

/**
 * .what = runs one read-check-write of a stone's rewind generation while the stone's
 *         key is held, so no rewind bump interleaves with it
 * .why = a rewind bumps the generation; a guard round checks it before each write. both
 *        sides take this one hold, so a round write either lands before the bump (and the
 *        rewind then deletes it) or after it (and the round then discards it). never both
 *
 * .note = the hold spans ONE watermark transition, never a round. its worst case is a
 *         passage.jsonl read plus one small write — milliseconds — so a 30s lease
 *         bounds a stalled holder, and a crashed holder frees the key within 30s
 * .note = acquire waits at most 5s: a hold is milliseconds, so a 5s wait means the key
 *         is stuck, and that surfaces loud as a SimpleMutexAcquireTimeoutError
 * .note = not reentrant: the logic must never take the same stone's hold again
 */
export const withStoneGenerationHold = async <TOutput>(input: {
  route: string;
  stone: string;
  logic: () => Promise<TOutput>;
}): Promise<TOutput> => {
  const held = withSimpleMutex(
    async (_: { route: string; stone: string }) => input.logic(),
    {
      key: asStoneGenerationMutexKey,
      cache: STONE_GENERATION_MUTEX_CACHE,
      lease: { duration: { seconds: 30 } },
      acquire: {
        timeout: { seconds: 5 },
        interval: { milliseconds: 20 },
      },
    },
  );
  return held({ route: input.route, stone: input.stone });
};
