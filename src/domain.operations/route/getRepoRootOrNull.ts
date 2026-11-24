import { getGitRepoRoot } from 'rhachet-artifact-git';

/**
 * .what = looks up the git repo root of a path, or null when the path sits in no git repo
 * .why = callers differ on what "no git repo" falls back to (the cwd, the path itself), so the
 *        lookup and the one absence it tolerates live here once, and each caller names its own
 *        fallback with `??`
 *
 * .note = only the "not inside a git repo" fault reads as null; any other fault rethrows
 *         (rule.forbid.failhide). the message match is the only sentinel upstream gives:
 *         `.dream/v2026_09_16.reseed.git-repo-root-absence-has-no-sentinel.md`
 */
export const getRepoRootOrNull = async (input: {
  from: string;
}): Promise<string | null> => {
  try {
    return await getGitRepoRoot({ from: input.from });
  } catch (error) {
    // only the "not in git repo" fault is absence; a cross-module class makes instanceof unsafe
    const isNotInGitRepoError =
      error instanceof Error && error.message.includes('Not inside a Git');
    if (!isNotInGitRepoError) throw error;
    return null;
  }
};
