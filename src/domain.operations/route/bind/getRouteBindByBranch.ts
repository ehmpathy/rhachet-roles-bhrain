import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { getAllBindFlagsByBranch } from './getAllBindFlagsByBranch';

/**
 * .what = looks up the bound route for the current (or given) branch
 * .why = enables auto-lookup of --route from bind flag files
 */
export const getRouteBindByBranch = async (input: {
  branch: string | null;
}): Promise<{ route: string } | null> => {
  // scan for bind flag files
  const { branch, flagFiles } = await getAllBindFlagsByBranch({
    branch: input.branch,
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
