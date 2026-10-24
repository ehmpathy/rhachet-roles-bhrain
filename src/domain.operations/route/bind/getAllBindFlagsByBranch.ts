import { execSync } from 'child_process';

import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { asRouteBindFlagName } from './asRouteBindFlagName';

/**
 * .what = finds all bind flag files for a branch
 * .why = shared lookup used by get/set/del bind operations
 */
export const getAllBindFlagsByBranch = async (input: {
  branch: string | null;
}): Promise<{ branch: string; flagFiles: string[] }> => {
  // get branch name (from input or git)
  const branch =
    input.branch ??
    execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

  // scan for bind flag files (dot: true to traverse .behavior/ etc)
  const flagGlob = `**/.route/${asRouteBindFlagName({ branch })}`;
  const flagFiles = await enumFilesFromGlob({
    glob: flagGlob,
    cwd: process.cwd(),
    dot: true,
    ignore: [
      '**/node_modules/**',
      '**/.git/**', // git's own store holds no route; dot: true would walk it whole
      '**/.agent/.actors/**', // per-seat brain state (transcripts, caches); holds no route
      '**/.agent/.cache/**', // tool caches; holds no route

      '**/{dist,.dist}/**',
      '**/{temp,.temp}/**',
      '**/{artifact,.artifact}/**',
    ],
  });

  // sort, so a multi-bind fault names its flags in one order on every run
  return { branch, flagFiles: [...flagFiles].sort() };
};
