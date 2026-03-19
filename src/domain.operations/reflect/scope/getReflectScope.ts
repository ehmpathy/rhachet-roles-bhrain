import { execSync } from 'child_process';
import { BadRequestError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';

/**
 * .what = scope for reflect operations (snapshots, savepoints, annotations)
 * .why = consistent path computation for all reflect artifacts
 */
export interface ReflectScope {
  /**
   * git repository root path
   */
  gitRepoRoot: string;

  /**
   * git repository name (basename of root)
   */
  gitRepoName: string;

  /**
   * worktree directory name (if in a worktree, otherwise same as gitRepoName)
   */
  worktreeName: string;

  /**
   * current branch name
   */
  branch: string;

  /**
   * branch name safe for filesystem paths (/ replaced with ~)
   */
  branchSafe: string;

  /**
   * directory from which scope was detected
   */
  cwd: string;

  /**
   * base storage path for this repo/worktree/branch
   */
  storagePath: string;
}

/**
 * .what = base directory for reflector role storage
 * .why = follows rhachet convention for role-scoped storage
 */
const ROLE_STORAGE_DIR = path.join(
  os.homedir(),
  '.rhachet/storage/repo=bhrain/role=reflector/skills/reflect.snapshot',
);

/**
 * .what = detects reflect scope from current directory
 * .why = enables consistent path computation for snapshots, savepoints, annotations
 */
export const getReflectScope = (input: { cwd: string }): ReflectScope => {
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

  // detect git repo root (note: for worktrees this is the worktree dir, not main repo)
  const gitRepoRoot = execSync('git rev-parse --show-toplevel', {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: 'pipe',
  }).trim();

  // detect worktree via gitDir
  // worktrees have gitDir like: /path/to/main-repo/.git/worktrees/worktree-name
  // main repo has gitDir as just ".git" or absolute "/path/to/repo/.git"
  const gitDir = execSync('git rev-parse --git-dir', {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: 'pipe',
  }).trim();

  const isWorktree = gitDir.includes('/worktrees/');

  // extract actual git repo name
  // for worktrees: parse from gitDir path (before /.git/worktrees/)
  // for main repo: basename of gitRepoRoot
  let gitRepoName: string;
  if (isWorktree) {
    // gitDir = /path/to/main-repo/.git/worktrees/worktree-name
    // extract main-repo by split on /.git/worktrees/
    const mainRepoGitDir = gitDir.split('/.git/worktrees/')[0];
    gitRepoName = mainRepoGitDir
      ? path.basename(mainRepoGitDir)
      : path.basename(gitRepoRoot);
  } else {
    gitRepoName = path.basename(gitRepoRoot);
  }

  const worktreeName = isWorktree ? path.basename(gitRepoRoot) : gitRepoName;

  // detect branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: 'pipe',
  }).trim();

  // branch name safe for filesystem (/ → ~)
  const branchSafe = branch.replace(/\//g, '~');

  // compute storage path
  const storagePath = path.join(
    ROLE_STORAGE_DIR,
    `gitrepo=${gitRepoName}`,
    `worktree=${worktreeName}`,
    `branch=${branchSafe}`,
  );

  return {
    gitRepoRoot,
    gitRepoName,
    worktreeName,
    branch,
    branchSafe,
    cwd: input.cwd,
    storagePath,
  };
};
