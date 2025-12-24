import { execSync } from 'child_process';
import { BadRequestError } from 'helpful-errors';

/**
 * .what = extracts git remote origin url from repository
 * .why = enables construction of github urls for citations
 */
export const getGitRemoteUrl = (input: { cwd: string }): string => {
  // verify this is a git repository
  try {
    execSync('git rev-parse --git-dir', {
      cwd: input.cwd,
      stdio: 'pipe',
    });
  } catch {
    throw new BadRequestError('directory is not a git repository', {
      cwd: input.cwd,
    });
  }

  // get remote origin url
  try {
    const result = execSync('git remote get-url origin', {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return result.trim();
  } catch {
    throw new BadRequestError(
      'git repository has no remote origin configured',
      {
        cwd: input.cwd,
        hint: 'run: git remote add origin <url>',
      },
    );
  }
};
