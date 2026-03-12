import * as fs from 'fs/promises';
import * as path from 'path';

import {
  RouteBouncerCache,
  RouteBouncerProtection,
} from '@src/domain.objects/Driver';

import { getAllBindFlagsByBranch } from '../bind/getAllBindFlagsByBranch';

/**
 * .what = reads bouncer caches from bound routes (or cwd as fallback) and aggregates
 * .why = enables fast protection lookup across all routes
 *
 * .note = also checks cwd as fallback when no routes are bound (e.g., route is '.')
 */
export const getRouteBouncerCache = async (): Promise<RouteBouncerCache> => {
  // find all bound routes for current branch
  const { flagFiles } = await getAllBindFlagsByBranch({ branch: null });

  // collect route directories to scan
  const routeDirs: string[] = [];
  const seenRoutes = new Set<string>();

  for (const flagFile of flagFiles) {
    // derive route path: flag is at <route>/.route/.bind.*.flag
    const routeDir = path.dirname(path.dirname(flagFile));
    if (!seenRoutes.has(routeDir)) {
      seenRoutes.add(routeDir);
      routeDirs.push(routeDir);
    }
  }

  // also check cwd as fallback (handles route = '.' without bind)
  const cwdRoute = process.cwd();
  if (!seenRoutes.has(cwdRoute)) {
    routeDirs.push(cwdRoute);
  }

  // aggregate protections from all routes
  const protections: RouteBouncerProtection[] = [];

  for (const routeDir of routeDirs) {
    const cachePath = path.join(routeDir, '.route', '.bouncer.cache.json');

    try {
      const content = await fs.readFile(cachePath, 'utf-8');
      const routeCache = JSON.parse(content);
      for (const protection of routeCache.protections ?? []) {
        protections.push(new RouteBouncerProtection(protection));
      }
    } catch {
      // absent or corrupt cache for this route → skip
    }
  }

  return new RouteBouncerCache({ protections });
};
