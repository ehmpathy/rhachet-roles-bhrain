import { BadRequestError } from 'helpful-errors';

import { asRouteDirOfBindFlag } from './asRouteDirOfBindFlag';
import { asRouteRelative } from './asRouteRelative';
import { getAllBindFlagsByBranch } from './getAllBindFlagsByBranch';

/**
 * .what = the bind flag this route already holds on the current branch, or null when none
 *         stands; refuses a bind the branch cannot take
 * .why = one home for the two bind refusals — a protected branch, and another route already
 *        bound — so a caller can check them before it writes aught, and `setRouteBind` checks
 *        the very same rules at the moment it binds
 * .note = reads only; the route dir need not exist yet
 */
export const getOneRouteBindFlagFound = async (input: {
  route: string;
}): Promise<{ branch: string; flagPath: string | null }> => {
  // scan for pre-bound flags for this branch
  const { branch, flagFiles: flagFilesFound } = await getAllBindFlagsByBranch({
    branch: null,
  });

  // reject protected branches
  const protectedBranches = ['main', 'master'];
  if (protectedBranches.includes(branch))
    throw new BadRequestError('cannot bind route on protected branch', {
      branch,
      hint: 'bind from a feature branch: git checkout -b feat/<slug>',
    });

  // none bound → this route may take the bind
  const [flagPathFound] = flagFilesFound;
  if (!flagPathFound) return { branch, flagPath: null };

  // same route → the extant flag; different route → refused
  const routeRelative = asRouteRelative({ at: input.route });
  const routeDirFound = asRouteDirOfBindFlag({ flagPath: flagPathFound });
  if (routeDirFound === routeRelative)
    return { branch, flagPath: flagPathFound };
  throw new BadRequestError(
    `already bound to ${routeDirFound}. use route.bind --del first`,
    {
      branch,
      routeBound: routeDirFound,
      routeAsked: routeRelative,
      hint: 'unbind it first: rhx route.bind.del',
    },
  );
};
