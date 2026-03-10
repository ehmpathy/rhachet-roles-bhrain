import { execSync } from 'child_process';

import { sanitizeBranchName } from '@src/domain.operations/review/sanitizeBranchName';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = finds all bind flag files for a branch
 * .why = shared lookup used by get/set/del bind operations
 */
export const getAllBindFlagsByBranch = async (input: {
  branch: string | null;
}): Promise<{ branch: string; branchFlat: string; flagFiles: string[] }> => {
  // get branch name (from input or git)
  const branch =
    input.branch ??
    execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

  // flatten branch name for flag file lookup
  const branchFlat = sanitizeBranchName({ branch });

  // scan for bind flag files (dot: true to traverse .behavior/ etc)
  const flagGlob = `**/.route/.bind.${branchFlat}.flag`;
  const flagFiles = await enumFilesFromGlob({
    glob: flagGlob,
    cwd: process.cwd(),
    dot: true,
    ignore: [
      '**/node_modules/**',
      '**/{dist,.dist}/**',
      '**/{temp,.temp}/**',
      '**/{artifact,.artifact}/**',
    ],
  });

  return { branch, branchFlat, flagFiles };
};
