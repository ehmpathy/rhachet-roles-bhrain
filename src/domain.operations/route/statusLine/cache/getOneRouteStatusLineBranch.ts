import { getOneBranchFromGit } from './getOneBranchFromGit';
import { getOneBranchFromHeadFileOrNull } from './getOneBranchFromHeadFileOrNull';

/**
 * .what = the current branch name, read from the git dir's HEAD file
 * .why = the cache is keyed by branch, and a `git` spawn costs more cpu than the whole cache
 *        hit. a HEAD file read gives the same answer as `git rev-parse --abbrev-ref HEAD` for
 *        every checkout on a branch, at the cost of two small file reads
 *
 * .note = a detached HEAD, an absent `.git`, or any shape this read does not know falls back
 *         to the `git` spawn, which is the authority
 */
export const getOneRouteStatusLineBranch = (input: { cwd: string }): string => {
  // read the branch from the HEAD file, the cheap path
  const branchFromHead = getOneBranchFromHeadFileOrNull({ cwd: input.cwd });
  if (branchFromHead) return branchFromHead;

  // fall back to git itself, the authority
  return getOneBranchFromGit({ cwd: input.cwd });
};
