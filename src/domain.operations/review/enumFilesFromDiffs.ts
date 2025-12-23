import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = enumerates files changed in a git diff range
 * .why = supports --diffs input for reviewing changed files
 */
export const enumFilesFromDiffs = async (input: {
  range: 'uptil-main' | 'uptil-commit' | 'uptil-staged';
  cwd?: string;
}): Promise<string[]> => {
  const cwd = input.cwd ?? process.cwd();

  // build git command based on range
  const gitCommand = (() => {
    if (input.range === 'uptil-main') {
      return 'git diff main --name-only';
    }
    if (input.range === 'uptil-commit') {
      return 'git diff HEAD --name-only';
    }
    if (input.range === 'uptil-staged') {
      return 'git diff --staged --name-only';
    }
    throw new UnexpectedCodePathError('invalid range', { range: input.range });
  })();

  // execute git command
  const output = execSync(gitCommand, {
    cwd,
    encoding: 'utf-8',
  });

  // parse output into file paths
  const paths = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // filter to only include files (exclude directories and symlinks to directories)
  const files = await Promise.all(
    paths.map(async (filePath) => {
      try {
        const stat = await fs.stat(path.join(cwd, filePath));
        return stat.isFile() ? filePath : null;
      } catch {
        return null;
      }
    }),
  );

  // return sorted, deduplicated file paths
  return [...new Set(files.filter((f): f is string => f !== null))].sort();
};
