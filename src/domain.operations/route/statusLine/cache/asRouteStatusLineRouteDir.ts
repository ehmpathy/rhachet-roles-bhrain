import * as path from 'path';

/**
 * .what = the route's dir on disk, from a route that is either absolute or cwd-relative
 * .why = the bind lookup names a route relative to cwd; a caller may also name it absolute.
 *        one transformer keeps the fingerprint and the bind-flag check from two joins that
 *        could disagree
 */
export const asRouteStatusLineRouteDir = (input: {
  cwd: string;
  route: string;
}): string =>
  path.isAbsolute(input.route)
    ? input.route
    : path.join(input.cwd, input.route);
