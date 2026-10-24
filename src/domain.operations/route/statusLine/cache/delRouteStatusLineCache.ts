import { execSync } from 'child_process';
import * as fs from 'fs/promises';

import { asRouteStatusLineCachePath } from './asRouteStatusLineCachePath';
import { getOneRouteStatusLineBranch } from './getOneRouteStatusLineBranch';

/**
 * .what = drops the branch's status line cache file; a no-op when absent
 * .why = a bind changes which route the line names. an unbound seat caches the blank line
 *        under a fingerprint of the branch alone, so no stat can see a new bind flag. a
 *        `route.bind.set` calls this so the next repaint shows the route at once
 *
 * .note = an unbind needs no drop: a bound seat's fingerprint stats its own bind flag, so the
 *         next repaint after the flag goes misses on its own
 * .note = it drops the cache at the cwd AND at the git root. a seat's line runs at the project
 *         root, while a bind may run from any subdir; a drop at the subdir alone would leave the
 *         root seat's line stale for up to the max age
 * .note = the branch comes from `getOneRouteStatusLineBranch`, the very read that keys the
 *         cache, so the drop can never target another file than the one a repaint reads
 */
export const delRouteStatusLineCache = async (input: {
  cwd: string;
}): Promise<void> => {
  const cwds = [...new Set([input.cwd, getOneGitRepoRoot({ cwd: input.cwd })])];
  await Promise.all(
    cwds.map((cwd) =>
      fs.rm(
        asRouteStatusLineCachePath({
          cwd,
          branch: getOneRouteStatusLineBranch({ cwd }),
        }),
        { force: true },
      ),
    ),
  );
};

/**
 * .what = the git root of a cwd, via `git rev-parse --show-toplevel`
 * .why = the anchor a seat's line runs at; a bind op already requires a git repo
 */
const getOneGitRepoRoot = (input: { cwd: string }): string =>
  execSync('git rev-parse --show-toplevel', { cwd: input.cwd })
    .toString()
    .trim();
