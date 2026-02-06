import { execSync } from 'child_process';
import * as fs from 'fs/promises';

import { sanitizeBranchName } from '@src/domain.operations/review/sanitizeBranchName';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = removes the bind flag for the current branch
 * .why = enables clean unbind with idempotent semantics
 */
export const delRouteBind = async (): Promise<{ deleted: boolean }> => {
  // get current branch, flatten
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const branchFlat = sanitizeBranchName({ branch });

  // scan for bind flags
  const flagGlob = `**/.route/.bind.${branchFlat}.flag`;
  const flagFiles = await enumFilesFromGlob({
    glob: flagGlob,
    cwd: process.cwd(),
    dot: true,
  });

  // not found → idempotent success
  if (flagFiles.length === 0) return { deleted: false };

  // remove each flag file found
  for (const flagPath of flagFiles) {
    await fs.rm(flagPath, { force: true });
  }

  return { deleted: true };
};
