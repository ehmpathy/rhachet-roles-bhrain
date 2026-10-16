import { getAllTargetsByPolluterVerdict } from '@src/domain.operations/getAllTargetsByPolluterVerdict';
import { getAllFilePathsFromRange } from '@src/domain.operations/git/getAllFilePathsFromRange';

/**
 * .what = the review target paths — every file this branch adds or changes, untracked
 *         files included, repo-relative, less the scope polluters
 * .why = the SAME since-main set `rhx review --diffs since-main` reads, so a lane that
 *        gets no computed scope (an enroll lane) reads what every review lane reads
 *
 * .note = paths only: the list never carries patch text, so it reads no per-file diff.
 *         deleted files are dropped by the range read; polluters by
 *         `getAllTargetsByPolluterVerdict`, the one shared verdict `rhx review` applies
 *         (rule.require.exclude-review-scope-polluters). an enroll lane names no `--paths`
 *         glob, so no polluter is exempt by name
 */
export const getAllStoneGuardReviewTargetPaths = async (input: {
  repoRoot: string;
}): Promise<string[]> => {
  // every path the branch adds or changes since main
  const paths = await getAllFilePathsFromRange({
    range: 'since-main',
    cwd: input.repoRoot,
  });

  // keep only the paths the shared polluter verdict keeps
  const verdict = getAllTargetsByPolluterVerdict({
    targets: paths,
    globs: [],
    mode: 'drop',
  });
  return verdict.kept;
};
