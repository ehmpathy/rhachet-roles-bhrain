import {
  type FileChangeKind,
  getAllFileChangesFromRange,
} from './getAllFileChangesFromRange';
import { getAllFileDiffsOfChanges } from './getAllFileDiffsOfChanges';

/**
 * .what = a single file's change within a diff range
 * .why = pairs each changed path with its kind and patch text for review
 *
 * .note = a named shape, not an inline one: three operations outside this module read it
 *         (`asPathsOfFileDiffs`, `asFileDiffByPath`, `asTargetContentsWithDiffs`), which
 *         meets the 3+ reuse bar `rule.forbid.io-as-interfaces` exempts
 */
export interface FileDiff {
  path: string;
  changeKind: FileChangeKind;
  diff: string | null;
}

/**
 * .what = captures each changed file's kind and diff patch within a range
 * .why = reviewers need the exact delta of this pr alongside full content, so
 *        they focus on what changed and do not churn untouched code
 *
 * .note = which files a range holds is `getAllFileChangesFromRange`'s decision alone;
 *         this reads one patch per change, against the base that selected it
 *         (`getAllFileDiffsOfChanges`)
 *
 * 🟡 .note = a quiescence assumption, stated: the result is assembled from independent git
 *            reads — the selection's (merge-base, name-status, ls-files), then one
 *            `git diff <base> -- <path>` per tracked change and one `git diff --no-index`
 *            per untracked file. it is one tree state only while no commit, checkout, or
 *            index write lands between them; a write in that window can render a patch
 *            against a tree the selection no longer describes
 */
export const getAllFileDiffsFromRange = async (input: {
  range: 'since-main' | 'since-commit' | 'since-staged';
  cwd?: string;
}): Promise<FileDiff[]> => {
  const cwd = input.cwd ?? process.cwd();

  // select the changes once, with the base they were read against
  const { baseArgs, changes } = getAllFileChangesFromRange({
    range: input.range,
    cwd,
  });

  // one patch per change, in the selection's path order
  return getAllFileDiffsOfChanges({ changes, baseArgs, cwd });
};
