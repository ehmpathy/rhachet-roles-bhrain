import * as fs from 'fs/promises';

import { getAllBindFlagsByBranch } from './getAllBindFlagsByBranch';

/**
 * .what = removes the bind flag for the current branch
 * .why = enables clean unbind with idempotent semantics
 */
export const delRouteBind = async (): Promise<{ deleted: boolean }> => {
  // scan for bind flags
  const { flagFiles } = await getAllBindFlagsByBranch({ branch: null });

  // not found → idempotent success
  if (flagFiles.length === 0) return { deleted: false };

  // remove each flag file found
  for (const flagPath of flagFiles) {
    await fs.rm(flagPath, { force: true });
  }

  return { deleted: true };
};
