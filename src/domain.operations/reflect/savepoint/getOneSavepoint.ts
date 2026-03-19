import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';
import type { Savepoint } from './setSavepoint';

/**
 * .what = computes sha256 hash of content
 * .why = matches hash from setSavepoint
 */
const computeHash = (content: string): string =>
  createHash('sha256').update(content).digest('hex');

/**
 * .what = retrieves a specific savepoint by timestamp
 * .why = enables inspection of a specific code state moment
 */
export const getOneSavepoint = (input: {
  scope: ReflectScope;
  at: string;
}): Savepoint | null => {
  const savepointsDir = path.join(input.scope.storagePath, 'savepoints');
  const stagedPatchPath = path.join(savepointsDir, `${input.at}.staged.patch`);
  const unstagedPatchPath = path.join(
    savepointsDir,
    `${input.at}.unstaged.patch`,
  );

  // check if savepoint exists
  if (!fs.existsSync(stagedPatchPath) || !fs.existsSync(unstagedPatchPath)) {
    return null;
  }

  // read patch contents to compute stats
  const stagedContent = fs.readFileSync(stagedPatchPath, 'utf-8');
  const unstagedContent = fs.readFileSync(unstagedPatchPath, 'utf-8');

  // compute hash from content
  const hash = computeHash(stagedContent + unstagedContent).slice(0, 7);

  return {
    timestamp: input.at,
    hash,
    stagedPatchPath,
    stagedPatchBytes: Buffer.byteLength(stagedContent),
    unstagedPatchPath,
    unstagedPatchBytes: Buffer.byteLength(unstagedContent),
  };
};
