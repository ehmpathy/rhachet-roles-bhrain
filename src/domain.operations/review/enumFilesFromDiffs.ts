import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = detects whether a git ref exists
 * .why = enables fallback from origin/main to main for since-main range
 */
const refExists = (input: { ref: string; cwd: string }): boolean => {
  try {
    execSync(`git rev-parse --verify ${input.ref}`, {
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
 * .what = resolves the main branch ref (origin/main, origin/master, main, or master)
 * .why = prefer origin/ refs to compare against remote state, not local divergence
 */
const resolveMainBranch = (input: { cwd: string }): string => {
  // prefer origin refs (remote branches) to avoid local divergence
  if (refExists({ ref: 'origin/main', cwd: input.cwd })) return 'origin/main';
  if (refExists({ ref: 'origin/master', cwd: input.cwd }))
    return 'origin/master';

  // fall back to local branches (for repos without remotes, e.g., test fixtures)
  if (refExists({ ref: 'main', cwd: input.cwd })) return 'main';
  if (refExists({ ref: 'master', cwd: input.cwd })) return 'master';

  // neither exists - user needs to create a main branch
  throw new BadRequestError(
    'since-main requires a main or master branch to exist. create an initial commit on main first.',
    { cwd: input.cwd },
  );
};

/**
 * .what = enumerates files changed in a git diff range
 * .why = supports --diffs input for reviewing changed files
 */
export const enumFilesFromDiffs = async (input: {
  range: 'since-main' | 'since-commit' | 'since-staged';
  cwd?: string;
}): Promise<string[]> => {
  const cwd = input.cwd ?? process.cwd();

  // build git command based on range
  const gitCommand = (() => {
    if (input.range === 'since-main') {
      const mainBranch = resolveMainBranch({ cwd });
      // use merge-base to only show changes since branch point, not changes on main
      return `git diff $(git merge-base ${mainBranch} HEAD) --name-only`;
    }
    if (input.range === 'since-commit') {
      return 'git diff HEAD --name-only';
    }
    if (input.range === 'since-staged') {
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
