import { getRepoRootOrNull } from '../getRepoRootOrNull';

/**
 * .what = looks up the git repo root, with a cwd fallback when not in a git repo
 * .why = guard paths relativize against the repo root; integration tests run in temp
 *        dirs that are not git repos, so a cwd fallback keeps them functional.
 *
 * .note = shared so its call sites cannot drift apart — the whole route engine rests on it
 *         (passage gate, contemplation gate, review runner, peer meters, route cli,
 *         `setStoneBrain`, and more)
 *
 * 🔴 .note = the absence test lives in getRepoRootOrNull, and it fails LOUD both ways:
 *    - upstream rewords → the error rethrows; `[case2]` of the integration test runs the
 *      real lookup in a non-git dir, so CI goes red
 *    - a genuine fault swallowed there needs another error that carries `Not inside a Git`;
 *      `getGitRepoRoot.js:21` is its only producer
 */
export const getRepoRootWithFallback = async (input: {
  from: string;
}): Promise<string> =>
  (await getRepoRootOrNull({ from: input.from })) ?? process.cwd();
