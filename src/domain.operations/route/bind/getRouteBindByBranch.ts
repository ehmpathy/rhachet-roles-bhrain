import { execSync } from 'child_process';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { sanitizeBranchName } from '@src/domain.operations/review/sanitizeBranchName';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = resolves the bound route for the current (or given) branch
 * .why = enables auto-resolve of --route from bind flag files
 */
export const getRouteBindByBranch = async (input: {
  branch: string | null;
}): Promise<{ route: string } | null> => {
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
  });

  // no flags found → not bound
  if (flagFiles.length === 0) return null;

  // multiple flags found → ambiguity error
  if (flagFiles.length > 1)
    throw new BadRequestError(
      'multiple routes bound to this branch. use --route to disambiguate',
      { branch, flagFiles },
    );

  // derive route path: flag is at <route>/.route/.bind.*.flag
  const flagPath = flagFiles[0]!;
  const routeDir =
    path.relative(process.cwd(), path.dirname(path.dirname(flagPath))) || '.';
  return { route: routeDir };
};
