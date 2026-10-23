import * as path from 'path';

import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = the tree dirs among a grove root's entries, name-ordered
 * .why = the grove reader composes this rather than computes it inline. a tree is a
 *        dir OR a symlink — a worktree linked in from elsewhere is still a tree the
 *        grove must walk — and that predicate has one home here
 *
 * .note = pure — it reads the entries it is handed, never the disk, so a node
 *         `Dirent` fits as-is
 */
export const asReviewTreeDirs = (input: {
  root: string;
  entries: {
    name: string;
    isDirectory: () => boolean;
    isSymbolicLink: () => boolean;
  }[];
}): { name: string; dir: string }[] => {
  // keep the tree dirs, each with its full path
  const treeDirs = input.entries
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
    .map((entry) => ({
      name: entry.name,
      dir: path.join(input.root, entry.name),
    }));

  // order by name, on a clone — safe however the list above is later sourced
  return [...treeDirs].sort((a, b) => asNameOrder({ a, b }));
};

/**
 * .what = the order of tree dirs by name, lexical
 * .why = names the sort, so the reader states its order by name rather than by a
 *        closure to decode (rule.require.named-transformers)
 */
const asNameOrder = (input: {
  a: { name: string };
  b: { name: string };
}): number => compareStrings(input.a.name, input.b.name);
