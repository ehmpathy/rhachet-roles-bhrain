import type { FileChange } from '@src/domain.operations/git/getAllFileChangesFromRange';
import type { FileDiff } from '@src/domain.operations/git/getAllFileDiffsFromRange';
import { getAllFileDiffsOfChanges } from '@src/domain.operations/git/getAllFileDiffsOfChanges';

/**
 * .what = the patch of each selected change that is a review TARGET — and of no other
 * .why = a patch costs one `git diff`, and its bytes ride the pipe whole. a change the scope
 *        walk dropped (a polluter, an excluded path, another partition's file) is never
 *        sent, so its patch is never read: the read set is bounded by the prompt, never by
 *        whatever else the worktree happens to hold
 *
 * .note = a selection with no base (no `--diffs` asked) holds no changes, so it reads naught
 */
export const getAllFileDiffsOfTargets = (input: {
  selection: { baseArgs: string | null; changes: FileChange[] };
  targets: string[];
  cwd: string;
}): FileDiff[] => {
  // no base, no change to render
  if (input.selection.baseArgs === null) return [];

  // read a patch only for the changes the review sends
  return getAllFileDiffsOfChanges({
    changes: getAllChangesOfTargets({
      changes: input.selection.changes,
      targets: input.targets,
    }),
    baseArgs: input.selection.baseArgs,
    cwd: input.cwd,
  });
};

/**
 * .what = the changes whose path is one of the targets, in selection order
 * .why = named, so the read above says "the changes of the targets" rather than a set filter
 */
const getAllChangesOfTargets = (input: {
  changes: FileChange[];
  targets: string[];
}): FileChange[] => {
  const targetSet = new Set(input.targets);
  return input.changes.filter((change) => targetSet.has(change.path));
};
