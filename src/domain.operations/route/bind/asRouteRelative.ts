import * as path from 'path';

/**
 * .what = a route dir relative to the cwd, `.` for the cwd itself
 * .why = a bind compares the route asked for with the route a flag binds; both sides must take
 *        the same form, so the idiom lives once
 */
export const asRouteRelative = (input: { at: string }): string =>
  path.relative(process.cwd(), input.at) || '.';
