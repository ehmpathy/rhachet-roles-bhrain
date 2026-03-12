import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteBouncerCache } from '@src/domain.objects/Driver';

import { getAllBindFlagsByBranch } from '../bind/getAllBindFlagsByBranch';

/**
 * .what = writes bouncer cache to each route's .route/.bouncer.cache.json
 * .why = persists precomputed protections per route for fast lookup
 *
 * .note = writes empty cache for routes with no protections to clear stale data
 * .note = accepts explicit route for unbound routes (e.g., --route .)
 */
export const setRouteBouncerCache = async (input: {
  cache: RouteBouncerCache;
  route?: string;
}): Promise<void> => {
  // find all bound routes for current branch
  const { flagFiles } = await getAllBindFlagsByBranch({ branch: null });

  // build map from relative route path to absolute route path
  // (protection.route uses relative paths, we need absolute for fs writes)
  const routeAbsoluteByRelative = new Map<string, string>();
  for (const flagFile of flagFiles) {
    const routeAbsolute = path.dirname(path.dirname(flagFile));
    const routeRelative = path.relative(process.cwd(), routeAbsolute) || '.';
    routeAbsoluteByRelative.set(routeRelative, routeAbsolute);
  }

  // add explicit route if provided and not already in map
  if (input.route && !routeAbsoluteByRelative.has(input.route)) {
    // compute absolute path by joining cwd with relative route
    const routeAbsolute = path.isAbsolute(input.route)
      ? input.route
      : path.join(process.cwd(), input.route);
    routeAbsoluteByRelative.set(input.route, routeAbsolute);
  }

  // initialize protections map with empty arrays for all routes
  const protectionsByRoute = new Map<string, typeof input.cache.protections>();
  for (const routeRelative of routeAbsoluteByRelative.keys()) {
    protectionsByRoute.set(routeRelative, []);
  }

  // populate protections for each route (using relative paths as keys)
  for (const protection of input.cache.protections) {
    const routeProtections = protectionsByRoute.get(protection.route) ?? [];
    routeProtections.push(protection);
    protectionsByRoute.set(protection.route, routeProtections);
  }

  // write cache file for each route (empty ones too to clear stale data)
  for (const [routeRelative, protections] of protectionsByRoute) {
    const routeAbsolute = routeAbsoluteByRelative.get(routeRelative);
    if (!routeAbsolute) continue;

    const routeDir = path.join(routeAbsolute, '.route');
    await fs.mkdir(routeDir, { recursive: true });

    const cachePath = path.join(routeDir, '.bouncer.cache.json');
    const routeCache = { protections };
    await fs.writeFile(cachePath, JSON.stringify(routeCache, null, 2));
  }
};
