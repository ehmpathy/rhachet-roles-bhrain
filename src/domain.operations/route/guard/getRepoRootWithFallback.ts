import { getGitRepoRoot } from 'rhachet-artifact-git';

/**
 * .what = looks up the git repo root, with a cwd fallback when not in a git repo
 * .why = guard paths relativize against the repo root; integration tests run in temp
 *        dirs that are not git repos, so a cwd fallback keeps them functional.
 *        shared so the two guard call sites cannot drift apart.
 */
export const getRepoRootWithFallback = async (input: {
  from: string;
}): Promise<string> => {
  try {
    return await getGitRepoRoot({ from: input.from });
  } catch (error) {
    // only catch "not in git repo" error; rethrow any other errors
    // .note = check error message instead of instanceof due to cross-module class instances
    const isNotInGitRepoError =
      error instanceof Error && error.message.includes('Not inside a Git');
    if (!isNotInGitRepoError) throw error;

    return process.cwd();
  }
};
