import { execSync } from 'child_process';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';

/**
 * .what = computes sha256 hash of content
 * .why = enables content deduplication for savepoints
 */
const computeHash = (content: string): string =>
  createHash('sha256').update(content).digest('hex');

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
  // generate timestamp
  const timestamp = generateTimestamp();

  // get HEAD commit hash
  const commitHash = execSync('git rev-parse HEAD', {
    cwd: input.scope.gitRepoRoot,
    encoding: 'utf-8',
  }).trim();

  // get staged diff
  const stagedPatch = execSync('git diff --staged', {
    cwd: input.scope.gitRepoRoot,
    encoding: 'utf-8',
  });

  // get unstaged diff
  const unstagedPatch = execSync('git diff', {
    cwd: input.scope.gitRepoRoot,
    encoding: 'utf-8',
  });

  // compute hash of combined patches
  const hash = computeHash(stagedPatch + unstagedPatch).slice(0, 7);

  // construct paths
  const savepointsDir = path.join(input.scope.storagePath, 'savepoints');
  const stagedPatchPath = path.join(savepointsDir, `${timestamp}.staged.patch`);
  const unstagedPatchPath = path.join(
    savepointsDir,
    `${timestamp}.unstaged.patch`,
  );
  const commitPath = path.join(savepointsDir, `${timestamp}.commit`);

  // write files if apply mode
  if (input.mode === 'apply') {
    fs.mkdirSync(savepointsDir, { recursive: true });
    fs.writeFileSync(stagedPatchPath, stagedPatch);
    fs.writeFileSync(unstagedPatchPath, unstagedPatch);
    fs.writeFileSync(commitPath, commitHash);
  }

  return {
    timestamp,
    commit: {
      hash: commitHash,
    },
    patches: {
      hash,
      stagedPath: stagedPatchPath,
      stagedBytes: Buffer.byteLength(stagedPatch),
      unstagedPath: unstagedPatchPath,
      unstagedBytes: Buffer.byteLength(unstagedPatch),
    },
  };
};
