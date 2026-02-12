import { execSync } from 'child_process';
import * as fs from 'fs/promises';

import { sanitizeBranchName } from '@src/domain.operations/review/sanitizeBranchName';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = removes the bind flag for the current branch
 * .why = enables clean unbind with idempotent semantics
 */
export const delResearchBind = async (input?: {
  cwd?: string;
}): Promise<{ deleted: boolean }> => {
  const cwd = input?.cwd ?? process.cwd();

  // get current branch, flatten
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd })
    .toString()
    .trim();
  const branchFlat = sanitizeBranchName({ branch });

  // scan for bind flags (exclude temp dirs from tests)
  const flagGlob = `**/.research/**/.bind/${branchFlat}.*.flag`;
  const flagFiles = await enumFilesFromGlob({
    glob: flagGlob,
    cwd,
    dot: true,
    ignore: ['**/.temp/**', '**/node_modules/**'],
  });

  // not found → idempotent success
  if (flagFiles.length === 0) return { deleted: false };

  // remove each flag file found
  for (const flagPath of flagFiles) {
    await fs.rm(flagPath, { force: true });
  }

  return { deleted: true };
};
