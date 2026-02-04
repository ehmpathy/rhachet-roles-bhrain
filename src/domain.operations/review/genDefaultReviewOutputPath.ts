import { execSync } from 'child_process';

import { sanitizeBranchName } from './sanitizeBranchName';

/**
 * .what = gets the current git branch name
 * .why = needed to organize review outputs by branch
 */
const getCurrentGitBranch = (input: { cwd: string }): string => {
  return execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: 'pipe',
  }).trim();
};

/**
 * .what = generates filesystem-safe ISO timestamp
 * .why = colons and dots in ISO strings are problematic on some filesystems
 */
const genFilesafeIsoTimestamp = (): string => {
  return new Date().toISOString().replace(/[:.]/g, '-');
};

/**
 * .what = generates default review output path from git branch and timestamp
 * .why = enables --output omission with organized default location
 */
export const genDefaultReviewOutputPath = (input: { cwd: string }): string => {
  // get current git branch
  const branch = getCurrentGitBranch({ cwd: input.cwd });

  // sanitize branch for filesystem
  const branchSafe = sanitizeBranchName({ branch });

  // generate filesystem-safe ISO timestamp
  const isotime = genFilesafeIsoTimestamp();

  // compose path
  return `.review/${branchSafe}/${isotime}.output.md`;
};
