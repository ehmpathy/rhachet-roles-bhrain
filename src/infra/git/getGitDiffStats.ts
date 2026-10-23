import { execFileSync } from 'child_process';
import * as fs from 'fs';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = stats for a file from git diff or line count
 */
export interface GitDiffStats {
  /** total lines in the file */
  lines: number;
  /** lines added (null if new file without git history) */
  added: number | null;
  /** lines removed (null if new file without git history) */
  removed: number | null;
  /** change symbol: [+] new, [~] modified, [-] deleted */
  symbol: '[+]' | '[~]' | '[-]';
}

/**
 * .what = get diff stats for a single file
 * .why = enables route.review to show change summary per artifact
 * .note = every git call takes the path as argv, never as shell text, so a file name
 *         that holds `"`, a backtick, or `$(...)` is read as a name and never run
 * .note = only two git answers are benign, and each is allowlisted by its exit status:
 *         `ls-files --error-unmatch` exits 1 for an untracked path, and
 *         `rev-parse --verify --quiet HEAD` exits 1 where no commit exists yet. every
 *         other git fault (not a repo, absent binary, a corrupt index) throws, since a
 *         `[+]` rendered over a fault reads as a measured fact (rule.forbid.failhide)
 */
export const getGitDiffStats = (input: {
  file: string;
  cwd?: string;
}): GitDiffStats => {
  const cwd = input.cwd ?? process.cwd();
  const filePath = input.file;

  // stat the file; only an absence reads as deleted, a denial throws
  const fullPath = `${cwd}/${filePath}`;
  const fileStat = getOneFileStatOrNull({ at: fullPath });
  if (!fileStat) return { lines: 0, added: null, removed: null, symbol: '[-]' };

  // count total lines in file
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n').length;

  // a path git does not track is a new file
  const lsFilesOutput = execGitOrNullOnStatus({
    args: ['ls-files', '--error-unmatch', '--', filePath],
    cwd,
    statusBenign: 1,
  });
  if (lsFilesOutput === null)
    return { lines, added: null, removed: null, symbol: '[+]' };

  // diff against HEAD where a commit exists, else against the staged index
  const headSha = execGitOrNullOnStatus({
    args: ['rev-parse', '--verify', '--quiet', 'HEAD'],
    cwd,
    statusBenign: 1,
  });
  const diffOutput = execGit({
    args: headSha
      ? ['diff', '--numstat', 'HEAD', '--', filePath]
      : ['diff', '--numstat', '--cached', '--', filePath],
    cwd,
  });

  // a binary file's numstat row reads "-\t-\t": git counts no added or removed lines, so
  // neither count is claimed. `lines` stays the body's own newline split
  // .note = the shape of `lines` does not part a text body from a binary one; the `[~]` row
  //         with null counts is the signal a reader keys on
  if (/^-\t-\t/.test(diffOutput.trim()))
    return { lines, added: null, removed: null, symbol: '[~]' };

  // parse numstat output: "added\tremoved\tfilename"; no row means no change
  const match = diffOutput.trim().match(/^(\d+)\t(\d+)\t/);
  return {
    lines,
    added: match ? parseInt(match[1] ?? '0', 10) : 0,
    removed: match ? parseInt(match[2] ?? '0', 10) : 0,
    symbol: '[~]',
  };
};

/**
 * .what = stat a path, or null where it is absent
 * .why = `existsSync` answers false for EACCES too, which would render a file nobody
 *        could read as `[-]` deleted. absence is the shared allowlist; all else throws
 */
const getOneFileStatOrNull = (input: { at: string }): fs.Stats | null => {
  try {
    return fs.statSync(input.at);
  } catch (error) {
    if (isErrorOfAbsence({ error })) return null;
    throw error;
  }
};

/**
 * .what = run one git command with argv, no shell
 * .why = a path passed as argv cannot be parsed as shell syntax
 */
const execGit = (input: { args: string[]; cwd: string }): string =>
  execFileSync('git', input.args, {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: 'pipe',
  });

/**
 * .what = run one git command, or null where it exits with the one benign status
 * .why = some git commands answer "no" via an exit status; that status alone is the
 *        allowlist, so a fault with any other status (128: not a repo) still throws
 */
const execGitOrNullOnStatus = (input: {
  args: string[];
  cwd: string;
  statusBenign: number;
}): string | null => {
  try {
    return execGit({ args: input.args, cwd: input.cwd });
  } catch (error) {
    if (getExitStatusOfError({ error }) === input.statusBenign) return null;
    throw error;
  }
};

/**
 * .what = read the exit status off a caught execFileSync error, by shape
 * .why = the error crosses the jest vm realm, so `instanceof` is unreliable; the
 *        numeric `status` field survives that hop
 * .note = local, not beside the `isErrorOf*` predicates in `src/utils/fs/`: those
 *         read an fs `code` (`ENOENT`, `EACCES`); this reads a child process exit
 *         status, which only this file's `execFileSync` reads produce. lift it on
 *         the second caller
 */
const getExitStatusOfError = (input: { error: unknown }): number | null => {
  if (typeof input.error !== 'object' || input.error === null) return null;
  if (!('status' in input.error)) return null;
  return typeof input.error.status === 'number' ? input.error.status : null;
};
