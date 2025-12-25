import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

/**
 * .what = git identity env for commits
 * .why = avoids requiring global git config on cicd machines
 */
export const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test User',
  GIT_AUTHOR_EMAIL: 'test@test.com',
  GIT_COMMITTER_NAME: 'Test User',
  GIT_COMMITTER_EMAIL: 'test@test.com',
};

/**
 * .what = paths to the static test assets
 * .why = enables reuse of test fixtures across test cases
 */
export const ASSETS_REPO = path.join(__dirname, 'assets/example.repo');
export const ASSETS_TARGET = path.join(__dirname, 'assets/example.target');

/**
 * .what = copies repo assets to a temp directory with git initialized
 * .why = stepReflect requires source to be a git repo with remote origin
 */
export const setupSourceRepo = async (
  repoType: 'typescript-quality' | 'prose-author',
): Promise<{ repoDir: string }> => {
  const repoDir = path.join(
    os.tmpdir(),
    `bhrain-reflect-source-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  // copy repo assets to temp directory
  await fs.cp(path.join(ASSETS_REPO, repoType), repoDir, {
    recursive: true,
  });

  // initialize git repo with remote origin
  execSync('git init', { cwd: repoDir, stdio: 'pipe' });
  execSync('git remote add origin https://github.com/test/repo.git', {
    cwd: repoDir,
    stdio: 'pipe',
  });
  execSync('git add .', { cwd: repoDir, stdio: 'pipe' });
  execSync('git commit -m "initial"', {
    cwd: repoDir,
    stdio: 'pipe',
    env: GIT_ENV,
  });
  execSync('git branch -M main', { cwd: repoDir, stdio: 'pipe' });

  return { repoDir };
};

/**
 * .what = creates a temp target directory
 * .why = enables isolated testing of target directory operations
 */
export const setupTargetDir = async (): Promise<{ targetDir: string }> => {
  const targetDir = path.join(
    os.tmpdir(),
    `bhrain-reflect-target-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await fs.mkdir(targetDir, { recursive: true });
  return { targetDir };
};
