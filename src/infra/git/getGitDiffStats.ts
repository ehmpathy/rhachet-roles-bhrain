import { execSync } from 'child_process';
import * as fs from 'fs';

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
 */
export const getGitDiffStats = (input: {
  file: string;
  cwd?: string;
}): GitDiffStats => {
  const cwd = input.cwd ?? process.cwd();
  const filePath = input.file;

  // check if file exists
  const fullPath = `${cwd}/${filePath}`;
  const fileExists = fs.existsSync(fullPath);

  if (!fileExists) {
    // file was deleted
    return {
      lines: 0,
      added: null,
      removed: null,
      symbol: '[-]',
    };
  }

  // count total lines in file
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n').length;

  // check if file is tracked by git
  const isTracked = (() => {
    try {
      execSync(`git ls-files --error-unmatch "${filePath}"`, {
        cwd,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return true;
    } catch {
      return false;
    }
  })();

  if (!isTracked) {
    // new file, not yet in git
    return {
      lines,
      added: null,
      removed: null,
      symbol: '[+]',
    };
  }

  // get diff stats from git
  try {
    const diffOutput = execSync(
      `git diff --numstat HEAD -- "${filePath}" 2>/dev/null || git diff --numstat --cached -- "${filePath}"`,
      {
        cwd,
        encoding: 'utf-8',
        stdio: 'pipe',
      },
    );

    // parse numstat output: "added\tremoved\tfilename"
    const match = diffOutput.trim().match(/^(\d+)\t(\d+)\t/);
    if (match) {
      const added = parseInt(match[1] ?? '0', 10);
      const removed = parseInt(match[2] ?? '0', 10);
      return {
        lines,
        added,
        removed,
        symbol: '[~]',
      };
    }

    // no changes detected
    return {
      lines,
      added: 0,
      removed: 0,
      symbol: '[~]',
    };
  } catch {
    // git command failed, treat as new file
    return {
      lines,
      added: null,
      removed: null,
      symbol: '[+]',
    };
  }
};
