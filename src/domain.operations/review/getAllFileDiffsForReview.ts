import type { FileDiff } from '@src/domain.operations/git/getAllFileDiffsFromRange';
import { getAllFileChangesForReview } from '@src/domain.operations/review/getAllFileChangesForReview';
import { getAllFileDiffsOfTargets } from '@src/domain.operations/review/getAllFileDiffsOfTargets';

/**
 * .what = the file diffs a review's `--diffs` flag names, for the given targets only; none
 *         when the flag is absent
 * .why = a reader that already knows its targets (the meter, which re-reads a run's recorded
 *        scope) needs their patches and no other. a patch read for every change the range
 *        holds grew with the worktree's own run logs, not with the review
 */
export const getAllFileDiffsForReview = (input: {
  diffs: string | undefined;
  targets: string[];
  cwd: string;
}): FileDiff[] =>
  getAllFileDiffsOfTargets({
    selection: getAllFileChangesForReview({
      diffs: input.diffs,
      cwd: input.cwd,
    }),
    targets: input.targets,
    cwd: input.cwd,
  });
