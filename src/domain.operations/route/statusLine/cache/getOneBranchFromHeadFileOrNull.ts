import * as fs from 'fs';
import * as path from 'path';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = the branch named by `<gitdir>/HEAD`, or null when the read cannot answer
 * .why = a branch read with no process spawn: the status line cache and the status file
 *        writer both key by branch, and the bash reader mirrors this exact read
 *
 * .note = a worktree's `.git` is a file that holds `gitdir: <path>`; a plain checkout's
 *         `.git` is the dir itself. both hold a HEAD file of the form `ref: refs/heads/<b>`
 * .note = a detached HEAD, an absent `.git`, or an unknown shape reads as null
 */
export const getOneBranchFromHeadFileOrNull = (input: {
  cwd: string;
}): string | null => {
  const gitDir = getGitDir({ cwd: input.cwd });
  if (!gitDir) return null;

  const head = getOneFileContentOrNull({ filePath: path.join(gitDir, 'HEAD') });
  if (head === null) return null;
  return asBranchFromHeadContent({ head });
};

/**
 * .what = the git dir for a cwd, or null when `.git` is absent or of an unknown shape
 * .why = a worktree points to its git dir via a `gitdir:` file; a plain checkout holds it
 */
const getGitDir = (input: { cwd: string }): string | null => {
  const dotGit = path.join(input.cwd, '.git');
  const stat = getOneStatOrNull({ filePath: dotGit });
  if (!stat) return null;
  if (stat.isDirectory()) return dotGit;

  const pointer = getOneFileContentOrNull({ filePath: dotGit });
  if (pointer === null) return null;
  return asGitDirFromPointer({ pointer, cwd: input.cwd });
};

/**
 * .what = the branch in a HEAD file's content, or null for a detached or unknown HEAD
 */
const asBranchFromHeadContent = (input: { head: string }): string | null =>
  /^ref: refs\/heads\/(.+)$/.exec(input.head.trim())?.[1] ?? null;

/**
 * .what = the git dir a worktree's `.git` pointer names, as an absolute path, or null
 */
const asGitDirFromPointer = (input: {
  pointer: string;
  cwd: string;
}): string | null => {
  const gitDirRaw = /^gitdir: (.+)$/m.exec(input.pointer)?.[1]?.trim() ?? null;
  if (!gitDirRaw) return null;
  return path.isAbsolute(gitDirRaw)
    ? gitDirRaw
    : path.join(input.cwd, gitDirRaw);
};

/**
 * .what = a file's utf-8 content, or null when the file is absent
 * .why = an absent file only means "this cheap read cannot answer". any other fs fault
 *        rethrows (rule.forbid.failhide)
 */
const getOneFileContentOrNull = (input: {
  filePath: string;
}): string | null => {
  try {
    return fs.readFileSync(input.filePath, 'utf-8');
  } catch (error) {
    if (isErrorOfAbsence({ error })) return null;
    throw error;
  }
};

/**
 * .what = a path's stat, or null when the path is absent
 * .why = same contract as getOneFileContentOrNull, for the `.git` shape probe
 */
const getOneStatOrNull = (input: { filePath: string }): fs.Stats | null => {
  try {
    return fs.statSync(input.filePath);
  } catch (error) {
    if (isErrorOfAbsence({ error })) return null;
    throw error;
  }
};
