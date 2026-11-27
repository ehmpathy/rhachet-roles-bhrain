import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { delRouteStatusLineCacheOrWarn } from '@src/domain.operations/route/statusLine/cache/delRouteStatusLineCacheOrWarn';

import { asRouteBindFlagName } from './asRouteBindFlagName';
import { asRouteRelative } from './asRouteRelative';
import { getOneRouteBindFlagFound } from './getOneRouteBindFlagFound';

/**
 * .what = binds a route to the current branch via flag file
 * .why = enables subsequent route commands to auto-lookup --route
 *
 * .note = every bind drops the status line cache, a re-bind of the same route included, so
 *         the next repaint names the bound route at once. the drop is idempotent, so it runs
 *         from one exit, after the flag is settled
 */
export const setRouteBind = async (input: {
  route: string;
}): Promise<{ route: string; flagPath: string }> => {
  const bound = await setRouteBindFlag({ route: input.route });
  await delRouteStatusLineCacheOrWarn({ cwd: process.cwd() });
  return bound;
};

/**
 * .what = writes the bind flag for the current branch, or finds the one that stands
 * .why = the flag is the bind; a second bind of the same route is idempotent, and a bind of
 *        another route while one stands is refused
 */
const setRouteBindFlag = async (input: {
  route: string;
}): Promise<{ route: string; flagPath: string }> => {
  // validate route directory found
  const routeAbsolute = path.resolve(input.route);
  try {
    await fs.access(routeAbsolute);
  } catch {
    throw new BadRequestError(`route directory does not exist: ${input.route}`);
  }

  // the bind refusals (protected branch, another route bound); same route → idempotent
  const routeRelative = asRouteRelative({ at: routeAbsolute });
  const { branch, flagPath: flagPathFound } = await getOneRouteBindFlagFound({
    route: input.route,
  });
  if (flagPathFound) return { route: routeRelative, flagPath: flagPathFound };

  // ensure .route/ directory found
  const routeStateDir = path.join(routeAbsolute, '.route');
  await fs.mkdir(routeStateDir, { recursive: true });

  // write flag file
  const flagPath = path.join(routeStateDir, asRouteBindFlagName({ branch }));
  const flagContent = `branch: ${branch}\nbound_by: route.bind skill\n`;
  await fs.writeFile(flagPath, flagContent);
  return { route: routeRelative, flagPath };
};
