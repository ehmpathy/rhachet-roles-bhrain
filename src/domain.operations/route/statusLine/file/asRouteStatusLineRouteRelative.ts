import * as path from 'path';

import { asRouteStatusLineRouteDir } from '../cache/asRouteStatusLineRouteDir';

/**
 * .what = a route path relative to the cwd, the form the pointer and the status file carry
 * .why = the bash reader joins it to its own cwd; a caller may name the route absolute
 */
export const asRouteStatusLineRouteRelative = (input: {
  cwd: string;
  route: string;
}): string =>
  path.relative(
    input.cwd,
    asRouteStatusLineRouteDir({ cwd: input.cwd, route: input.route }),
  ) || '.';
