import * as path from 'path';

import {
  RouteBouncerCache,
  RouteBouncerProtection,
} from '@src/domain.objects/Driver';

import { getAllBindFlagsByBranch } from '../bind/getAllBindFlagsByBranch';
import { getOnePassageReport } from '../passage/getOnePassageReport';
import { getAllStones } from '../stones/getAllStones';

/**
 * .what = computes bouncer cache from bound routes or explicit route
 * .why = aggregates protect: directives across routes for enforcement
 *
 * .note = if explicit route provided, computes for that route even if unbound
 */
export const computeRouteBouncerCache = async (input: {
  cwd: string;
  route?: string;
}): Promise<RouteBouncerCache> => {
  // find all bound routes for current branch
  const { flagFiles } = await getAllBindFlagsByBranch({ branch: null });

  // collect routes to process (bound routes + explicit route if provided)
  const routeDirs: string[] = [];
  const seenRoutes = new Set<string>();

  for (const flagFile of flagFiles) {
    // derive route path: flag is at <route>/.route/.bind.*.flag
    const routeDir =
      path.relative(input.cwd, path.dirname(path.dirname(flagFile))) || '.';
    if (!seenRoutes.has(routeDir)) {
      seenRoutes.add(routeDir);
      routeDirs.push(routeDir);
    }
  }

  // add explicit route if provided and not already in list
  if (input.route && !seenRoutes.has(input.route)) {
    routeDirs.push(input.route);
  }

  // aggregate protections from all routes
  const protections: RouteBouncerProtection[] = [];

  for (const routeDir of routeDirs) {
    // get all stones with guards
    const stones = await getAllStones({ route: routeDir });

    for (const stone of stones) {
      // skip stones without guard or protect directive
      if (!stone.guard || stone.guard.protect.length === 0) continue;

      // check if stone has passed
      const passageReport = await getOnePassageReport({
        stone: stone.name,
        status: 'passed',
        route: routeDir,
      });
      const passed = passageReport !== null;

      // add protection for each glob
      for (const glob of stone.guard.protect) {
        protections.push(
          new RouteBouncerProtection({
            glob,
            stone: stone.name,
            guard: stone.guard.path,
            route: routeDir,
            passed,
          }),
        );
      }
    }
  }

  return new RouteBouncerCache({
    protections,
  });
};
