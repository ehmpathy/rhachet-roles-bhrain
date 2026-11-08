import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'fs';
import * as path from 'path';
import {
  createCache,
  isSimpleCacheConditionError,
  type SimpleOnDiskCache,
} from 'simple-on-disk-cache';
import { withSimpleMutex } from 'with-simple-mutex';

import { asTermsHookHoldFault } from './asTermsHookHoldFault';

/**
 * .what = one on-disk mutex cache per repo, at the dir rhachet's own settings writers use
 * .why = the toggle is a read-modify-write of a file rhachet also rewrites whole (the hook
 *        sync, the enroll derive). a lock of the toggle's own would keep two toggles apart,
 *        and still let a concurrent `rhx init` write from a stale read and drop the entry in
 *        silence. so the toggle claims rhachet's key in rhachet's cache: the same dir
 *        (`<repo real>/.agent/.actors/.locks/`), the same key (the file's path relative to the
 *        real repo root), the same packages at the same pins (`with-simple-mutex@0.1.1`,
 *        `simple-on-disk-cache@1.8.1`), and both sides take turns
 *
 * .note = rhachet does not export its `withRepoMutex`, so its dir and key rule are restated
 *         here; a change on rhachet's side splits the two locks. the dir and key rule read
 *         the same at every version the peer floor admits (`>=1.49.2`; read at v1.49.2,
 *         v1.50.0, and v1.51.0). the clamp in
 *         `learn.terms.hook.integration.test.ts` holds the key from the outside and asserts
 *         the toggle waits for it
 * .note = deliberate mutation — a process-wide memo, one cache instance per repo, built on
 *         first use (rule.require.locks-via-with-simple-mutex)
 */
const cacheByRepo = new Map<string, SimpleOnDiskCache>();
const genOneTermsHookMutexCache = (input: {
  repoReal: string;
}): SimpleOnDiskCache => {
  // findsert the dir and its `*` ignore, as rhachet does, so no key file shows in git status
  const dir = path.join(input.repoReal, '.agent', '.actors', '.locks');
  mkdirSync(dir, { recursive: true });
  try {
    writeFileSync(path.join(dir, '.gitignore'), '*\n', { flag: 'wx' });
  } catch (error) {
    const isFound =
      error instanceof Error && 'code' in error && error.code === 'EEXIST';
    if (!isFound) throw error;
  }

  // one instance per repo
  const found = cacheByRepo.get(input.repoReal);
  if (found) return found;
  const created = createCache({ directory: { local: { path: dir } } });
  cacheByRepo.set(input.repoReal, created);
  return created;
};

/**
 * .what = a path with its nearest extant dir followed through every link, the absent tail kept
 * .why = rhachet realpaths the file's dir, which always exists on its side; the toggle may
 *        lock a target whose dir is not yet made (`enable` in a repo with no `.claude`), so it
 *        walks up to the first dir that exists. where the dir exists the result equals
 *        rhachet's, so both sides still land on one key
 */
const getOnePathCanonical = (input: { path: string }): string => {
  const dir = path.dirname(input.path);
  const base = path.basename(input.path);
  if (existsSync(dir)) return path.join(realpathSync(dir), base);
  return path.join(getOnePathCanonical({ path: dir }), base);
};

/**
 * .what = the mutex key rhachet derives for one guarded file
 * .why = the file's path with its dir followed through every link, relative to the real repo
 *        root; so `<repo>/.claude/settings.of.repo.json` and the actor-dir path land on one key
 */
const getOneTermsHookMutexKey = (input: {
  repoReal: string;
  path: string;
}): string => {
  const pathAbsolute = path.isAbsolute(input.path)
    ? input.path
    : path.join(process.cwd(), input.path);
  const pathCanonical = getOnePathCanonical({ path: pathAbsolute });
  const pathRelative = path.relative(input.repoReal, pathCanonical);
  const isOutside =
    pathRelative.startsWith('..') || path.isAbsolute(pathRelative);
  return isOutside ? pathCanonical : pathRelative;
};

/**
 * .what = the mutex cache, wrapped to announce a wait once, the first time a peer holds the key
 * .why = a wait of up to two minutes with no word reads as a hang; the human learns at once
 *        that the toggle waits on another settings writer, and for how long at most. the cue
 *        is the one rhachet's own lock reads: a put-if-absent (`version: null`) that the
 *        cache refuses on its condition
 * .note = deliberate mutation — `isWaitAnnounced` is a flag this one call reads, so the notice
 *         prints once per verb
 */
const genOneTermsHookMutexCacheAnnounced = (input: {
  cache: SimpleOnDiskCache;
  pathShown: string;
}): SimpleOnDiskCache => {
  let isWaitAnnounced = false;
  return {
    ...input.cache,
    set: async (...args: Parameters<SimpleOnDiskCache['set']>) => {
      try {
        return await input.cache.set(...args);
      } catch (error) {
        const isPeerHold =
          args[2]?.condition?.version === null &&
          isSimpleCacheConditionError(error);
        if (isPeerHold && !isWaitAnnounced) {
          isWaitAnnounced = true;
          console.error(
            `⏳ another settings write holds ${input.pathShown}; learn.terms.hook waits for it, up to 2 min`,
          );
        }
        throw error;
      }
    },
  };
};

/**
 * .what = run one read-modify-write of the settings target while rhachet's key for it is held
 * .why = so a toggle and an `rhx init`, `rhx enroll`, or a second toggle never interleave
 *
 * .note = the hold spans one file read plus one small write, so a 30s lease bounds a stalled
 *         holder and a 2 min wait outlasts any live rhachet hold (its own wait bound)
 * .note = not reentrant: the logic must never take the same hold again
 * .note = a wait is announced on stderr once; a wait that outlasts the bound is refused by
 *         name, the busy file shown
 */
export const withTermsHookSettingsHold = async <TOutput>(input: {
  repoRoot: string;
  path: string;
  pathShown: string;
  logic: () => Promise<TOutput>;
}): Promise<TOutput> => {
  const repoReal = realpathSync(input.repoRoot);
  const held = withSimpleMutex(
    async (_: { repoReal: string; path: string }) => input.logic(),
    {
      key: getOneTermsHookMutexKey,
      cache: genOneTermsHookMutexCacheAnnounced({
        cache: genOneTermsHookMutexCache({ repoReal }),
        pathShown: input.pathShown,
      }),
      lease: { duration: { seconds: 30 } },
      acquire: {
        timeout: { minutes: 2 },
        interval: { milliseconds: 100 },
      },
    },
  );
  return held({ repoReal, path: input.path }).catch((error: unknown) => {
    throw asTermsHookHoldFault({ error, pathShown: input.pathShown });
  });
};
