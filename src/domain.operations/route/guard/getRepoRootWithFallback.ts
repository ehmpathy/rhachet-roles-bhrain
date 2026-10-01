import { getGitRepoRoot } from 'rhachet-artifact-git';

/**
 * .what = looks up the git repo root, with a cwd fallback when not in a git repo
 * .why = guard paths relativize against the repo root; integration tests run in temp
 *        dirs that are not git repos, so a cwd fallback keeps them functional.
 *
 * .note = shared so its call sites cannot drift apart — the whole route engine rests on it
 *         (passage gate, contemplation gate, review runner, peer meters, route cli,
 *         `setStoneBrain`, and more)
 */
export const getRepoRootWithFallback = async (input: {
  from: string;
}): Promise<string> => {
  try {
    return await getGitRepoRoot({ from: input.from });
  } catch (error) {
    // only catch "not in git repo" error; rethrow any other errors
    // .note = check error message instead of instanceof due to cross-module class instances
    //
    // 🔴 .note = the message match is a real dependency, and it fails LOUD both ways:
    //    - upstream rewords → predicate false → the error rethrows; `[case2]` of the
    //      integration test runs the real lookup in a non-git dir, so CI goes red
    //    - a genuine fault swallowed here needs another error that carries
    //      `Not inside a Git`; `getGitRepoRoot.js:21` is its only producer
    //
    // .note = `instanceof BadRequestError` is WIDER, not stronger: it is a generic 400 with
    //    no `code`, so it would swallow every future BadRequestError upstream adds. a true
    //    sentinel is upstream's to give:
    //    `.dream/v2026_09_16.reseed.git-repo-root-absence-has-no-sentinel.md`
    const isNotInGitRepoError =
      error instanceof Error && error.message.includes('Not inside a Git');
    if (!isNotInGitRepoError) throw error;

    return process.cwd();
  }
};
