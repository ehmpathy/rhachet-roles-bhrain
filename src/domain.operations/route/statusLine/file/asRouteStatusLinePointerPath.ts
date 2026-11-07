import * as path from 'path';

import { sanitizeBranchName } from '@src/utils/git/sanitizeBranchName';

import { DIR_OF_ROUTE_STATUS_LINE_CACHE } from '../cache/asRouteStatusLineCachePath';

/**
 * .what = the per-branch pointer file: `<cache dir>/branch=<flat>.route`
 * .why = the bash reader cannot walk the repo for a bind flag, so it reads one fixed path,
 *        keyed by branch, that names the route bound to that branch
 *
 * .note = its one line is the route path, relative to the cwd, or `MARK_OF_MULTI_BIND`
 * .note = a peer of pr #700's node cache record (`branch=<flat>.json`) in the same dir, but
 *         its own file: the node record has its own writer and age rule (fulcrum F9)
 */
export const asRouteStatusLinePointerPath = (input: {
  cwd: string;
  branch: string;
}): string =>
  path.join(
    input.cwd,
    DIR_OF_ROUTE_STATUS_LINE_CACHE,
    `branch=${sanitizeBranchName({ branch: input.branch })}.route`,
  );
