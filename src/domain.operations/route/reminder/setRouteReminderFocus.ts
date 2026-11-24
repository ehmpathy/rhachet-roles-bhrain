import * as fs from 'fs/promises';
import * as path from 'path';

import { asTempPathBeside } from '../asTempPathBeside';
import { getRouteReminderFocus } from './getRouteReminderFocus';
import { getRouteReminderFocusPath } from './getRouteReminderFocusPath';
import { setRouteReminderHandleDir } from './setRouteReminderHandleDir';
import { withToleratedIoFaultAsValue } from './withToleratedIoFaultAsValue';

/**
 * .what = points a clone's RouteReminder at the route the clone drives now
 * .why = one daemon serves the clone, whatever routes it has driven. the daemon reads the focus each
 *        tick and nudges about that route alone, so a clone that moves from route A to route B
 *        refocuses its live daemon with this one write — no spawn, no reap, no window with zero or
 *        two daemons
 *
 * .note = a set: it converges on the given route. it writes only when the content differs, so a
 *         drive that repeats on one route costs one read, never a write per hook
 *
 * .note = the write is a temp file + rename, atomic on one filesystem, so the daemon's tick reads
 *         the old route or the new one, never a torn path. it mirrors the status-line cache's own
 *         atomic write (setRouteStatusLineCache)
 */
export const setRouteReminderFocus = async (input: {
  repoRoot: string;
  cloneAddr: string;
  route: string;
}): Promise<{ changed: boolean }> => {
  const routeAbsolute = path.resolve(input.route);

  // a focus that already names this route needs no write
  const focusFound = await getRouteReminderFocus({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });
  if (focusFound?.route === routeAbsolute) return { changed: false };

  // write a temp file unique to this process, then rename it over the focus
  const focusPath = getRouteReminderFocusPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });
  await setRouteReminderHandleDir({ dirPath: path.dirname(focusPath) });
  const tempPath = asTempPathBeside({ path: focusPath });
  try {
    await fs.writeFile(tempPath, `${routeAbsolute}\n`);
    await fs.rename(tempPath, focusPath);
  } catch (error) {
    // drop the orphan temp file, then surface the ORIGINAL fault. a tolerated io fault on that
    // cleanup is let go, so it cannot mask the write fault; any other cleanup fault rethrows
    // (rule.forbid.failhide)
    await withToleratedIoFaultAsValue(() => fs.rm(tempPath, { force: true }));
    throw error;
  }
  return { changed: true };
};
