import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = detects whether a git branch exists
 * .why = enables fallback from main to master for uptil-main range
 */
const branchExists = (input: { branch: string; cwd: string }): boolean => {
  try {
    execSync(`git rev-parse --verify ${input.branch}`, {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * .what = resolves the main branch name (main or master)
 * .why = different git configs use different default branch names
 */
const resolveMainBranch = (input: { cwd: string }): string => {
  // try main first (newer convention)
  if (branchExists({ branch: 'main', cwd: input.cwd })) return 'main';

  // fall back to master (older convention)
  if (branchExists({ branch: 'master', cwd: input.cwd })) return 'master';

  // neither exists - user needs to create a main branch
  throw new BadRequestError(
    'uptil-main requires a main or master branch to exist. create an initial commit on main first.',
    { cwd: input.cwd },
  );
};

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
      const mainBranch = resolveMainBranch({ cwd });
      return `git diff ${mainBranch} --name-only`;
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
