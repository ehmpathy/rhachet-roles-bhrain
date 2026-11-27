import * as path from 'path';

import { asRouteRelative } from './asRouteRelative';

/**
 * .what = the route dir a bind flag binds, relative to the cwd (`.` for the cwd itself)
 * .why = a bind flag sits at `$route/.route/$flag`, two levels below the route it binds; the
 *        refusal names that route, and a re-bind compares it to the route asked for
 */
export const asRouteDirOfBindFlag = (input: { flagPath: string }): string =>
  asRouteRelative({ at: path.dirname(path.dirname(input.flagPath)) });
