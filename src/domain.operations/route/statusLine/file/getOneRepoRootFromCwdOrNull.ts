import * as fs from 'fs';
import * as path from 'path';

/**
 * .what = the nearest dir at or above a cwd that holds a `.git` entry, or null
 * .why = the status file pointer lives at the repo root, where the harness runs the reader; a
 *        writer run from a subdir must anchor there too, or it names a pointer no seat reads
 *
 * .note = no `git` spawn: the walk mirrors the bash reader's own walk up to `.git`, so the two
 *         agree on one anchor. a `.git` file (a worktree) counts as a `.git` dir does
 */
export const getOneRepoRootFromCwdOrNull = (input: {
  cwd: string;
}): string | null => {
  // this dir holds .git → it is the root
  if (fs.existsSync(path.join(input.cwd, '.git'))) return input.cwd;

  // the filesystem root, with no .git found → no repo
  const parent = path.dirname(input.cwd);
  if (parent === input.cwd) return null;

  // walk up one dir
  return getOneRepoRootFromCwdOrNull({ cwd: parent });
};
