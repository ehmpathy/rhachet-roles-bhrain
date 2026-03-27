import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';

/**
 * .what = a savepoint captures git diff state at a moment in time
 * .why = enables correlation of code state with transcript timeline
 */
export interface Savepoint {
  /**
   * iso timestamp when savepoint was captured
   */
  timestamp: string;

  /**
   * git commit state at time of savepoint
   */
  commit: {
    /**
     * HEAD commit hash
     * .why = enables reconstruction via: checkout hash, then apply patches
     */
    hash: string;
  };

  /**
   * patch state (staged + unstaged diffs)
   */
  patches: {
    /**
     * sha256 hash of combined patches (for deduplication)
     */
    hash: string;

    /**
     * path to staged.patch file
     */
    stagedPath: string;

    /**
     * size of staged.patch in bytes
     */
    stagedBytes: number;

    /**
     * path to unstaged.patch file
     */
    unstagedPath: string;

    /**
     * size of unstaged.patch in bytes
     */
    unstagedBytes: number;
  };
}

/**
 * .what = generates ISO timestamp for savepoint naming
 * .why = consistent timestamp format across all savepoints
 */
const generateTimestamp = (): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now
    .toISOString()
    .split('T')[1]
    ?.split('.')[0]
    ?.replace(/:/g, ''); // HHMMSS
  return `${date}.${time}`;
};

/**
 * .what = captures current git diff state as a savepoint
 * .why = enables correlation of code state with transcript at a moment
 */
export const setSavepoint = (input: {
  scope: ReflectScope;
  mode: 'plan' | 'apply';
}): Savepoint => {
  const cwd = input.scope.gitRepoRoot;

  // generate timestamp
  const timestamp = generateTimestamp();

  // get HEAD commit hash (small output, safe to buffer)
  const commitHash = execSync('git rev-parse HEAD', {
    cwd,
    encoding: 'utf-8',
  }).trim();

  // construct paths
  const savepointsDir = path.join(input.scope.storagePath, 'savepoints');
  const stagedPatchPath = path.join(savepointsDir, `${timestamp}.staged.patch`);
  const unstagedPatchPath = path.join(
    savepointsDir,
    `${timestamp}.unstaged.patch`,
  );
  const commitPath = path.join(savepointsDir, `${timestamp}.commit`);

  // apply mode: write files and compute from files
  if (input.mode === 'apply') {
    fs.mkdirSync(savepointsDir, { recursive: true });

    // write diffs directly to files via shell redirect
    execSync(`git diff --staged > "${stagedPatchPath}"`, { cwd });
    execSync(`git diff > "${unstagedPatchPath}"`, { cwd });
    fs.writeFileSync(commitPath, commitHash);

    // hash from files via shell (portable: linux sha256sum, macos shasum)
    const combinedHash = execSync(
      `cat "${stagedPatchPath}" "${unstagedPatchPath}" | (sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1`,
      { cwd, encoding: 'utf-8' },
    ).trim();

    return {
      timestamp,
      commit: { hash: commitHash },
      patches: {
        hash: combinedHash.slice(0, 7),
        stagedPath: stagedPatchPath,
        stagedBytes: fs.statSync(stagedPatchPath).size,
        unstagedPath: unstagedPatchPath,
        unstagedBytes: fs.statSync(unstagedPatchPath).size,
      },
    };
  }

  // plan mode: hash and sizes via shell pipes (no files written)
  const combinedHash = execSync(
    `(git diff --staged; git diff) | (sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1`,
    { cwd, encoding: 'utf-8' },
  ).trim();

  return {
    timestamp,
    commit: { hash: commitHash },
    patches: {
      hash: combinedHash.slice(0, 7),
      stagedPath: stagedPatchPath,
      stagedBytes: parseInt(
        execSync(`git diff --staged | wc -c`, {
          cwd,
          encoding: 'utf-8',
        }).trim(),
        10,
      ),
      unstagedPath: unstagedPatchPath,
      unstagedBytes: parseInt(
        execSync(`git diff | wc -c`, { cwd, encoding: 'utf-8' }).trim(),
        10,
      ),
    },
  };
};
