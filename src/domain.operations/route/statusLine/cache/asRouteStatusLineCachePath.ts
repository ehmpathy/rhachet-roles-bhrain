import * as path from 'path';

import { sanitizeBranchName } from '@src/utils/git/sanitizeBranchName';

/**
 * .what = the dir that holds the status line's per-branch cache files
 * .why = one home for the join, so the reader, the writer, and the bind ops that drop it
 *        cannot type it two ways
 *
 * .note = it sits under `.agent/.cache/` (gitignored), beside the review watermarks
 */
export const DIR_OF_ROUTE_STATUS_LINE_CACHE = path.join(
  '.agent',
  '.cache',
  'repo=bhrain',
  'role=driver',
  'skill=route.status.line',
);

/**
 * .what = the cache file path for one branch under one cwd
 * .why = the cache is keyed by branch, so a branch switch reads another file (or none)
 *
 * .note = this module, and each one the cache hit path imports, may import only node
 *         builtins and import-free transformers: a hit must cost node boot and naught else
 */
export const asRouteStatusLineCachePath = (input: {
  cwd: string;
  branch: string;
}): string =>
  path.join(
    input.cwd,
    DIR_OF_ROUTE_STATUS_LINE_CACHE,
    `branch=${sanitizeBranchName({ branch: input.branch })}.json`,
  );
