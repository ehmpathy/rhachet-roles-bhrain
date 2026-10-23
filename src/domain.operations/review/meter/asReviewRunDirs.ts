import * as path from 'path';

import { isReviewRunDir } from '@src/domain.operations/review/isReviewRunDir';

/**
 * .what = the review run dirs among a log root's entries, as sorted paths
 * .why = the mint grammar decides what is a run, never `.isDirectory()` alone. a
 *        stray dir (`old/`, `tmp/`, a hand-made scratch dir) that reaches the
 *        meter grades `refused`, a measured nil, and inflates the run count every
 *        rate is taken over (rule.forbid.failhide). named here for one home,
 *        rather than the last step of an inline pipeline.
 *
 * .note = pure — reads the entries it is handed, never the disk. asks only `name`
 *         and `isDirectory` of each, so a node `Dirent` fits as-is.
 */
export const asReviewRunDirs = (input: {
  root: string;
  entries: { name: string; isDirectory: () => boolean }[];
}): string[] => {
  // the run dirs among the entries, in the order the entries came
  const runDirs = input.entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(input.root, entry.name))
    .filter((at) => isReviewRunDir({ at }));

  // sorted on a clone, so no array is mutated in place (rule.require.immutable-vars)
  return [...runDirs].sort();
};
