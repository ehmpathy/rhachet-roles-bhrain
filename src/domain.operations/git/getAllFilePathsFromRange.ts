import { getAllFileChangesFromRange } from './getAllFileChangesFromRange';

/**
 * .what = the paths that exist now and changed within a range — no patch text
 * .why = a caller that needs only the path list (the guard's `$targets`) should not pay
 *        one `git diff` per changed file for patches it never reads
 *
 * .note = the same selection `getAllFileDiffsFromRange` makes, less its deleted entries.
 *         both derive from `getAllFileChangesFromRange`, so the two cannot disagree on
 *         which files a range holds
 */
export const getAllFilePathsFromRange = async (input: {
  range: 'since-main' | 'since-commit' | 'since-staged';
  cwd?: string;
}): Promise<string[]> => {
  // the one selection both readers share
  const { changes } = getAllFileChangesFromRange({
    range: input.range,
    cwd: input.cwd ?? process.cwd(),
  });

  // only the paths still on disk
  return asPathsOfChangesPresent({ changes });
};

/**
 * .what = the paths of each change whose file still exists — every kind but `deleted`
 * .why = a deleted path names no file a reader could open, so the path list omits it
 */
const asPathsOfChangesPresent = (input: {
  changes: Array<{ path: string; changeKind: string }>;
}): string[] =>
  input.changes
    .filter((change) => change.changeKind !== 'deleted')
    .map((change) => change.path);
