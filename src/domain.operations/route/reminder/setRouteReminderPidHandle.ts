import * as fs from 'fs/promises';
import * as path from 'path';

import { claimExclusiveWrite } from './claimExclusiveWrite';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = atomically claims a session's pid handle — writes it ONLY if none exists yet
 * .why = the register findsert must be race-safe: two concurrent registers of the same session
 *        must not both spawn a daemon. the exclusive-create (`wx`) write is the mutual exclusion
 *        — the filesystem itself guarantees exactly ONE writer wins, so the loser learns it lost
 *        (claimed:false) and reaps its extra daemon. this is the atomic core of the no-duplicate
 *        guarantee (rule.forbid.behavior-hazards — no unguarded read-modify-write).
 *
 * .note = the `wx` atomic-claim protocol lives in claimExclusiveWrite (the shared primitive, twin of
 *         setRouteReminderCrashLog's slot claim). this caller reads a lost race (claimed:false) as
 *         "a handle already existed — someone else claimed it, OR a stale handle survives; the caller
 *         reconciles which". any other write fault (permission, i/o) surfaces (rule.forbid.failhide).
 */
export const setRouteReminderPidHandle = async (input: {
  route: string;
  cloneAddr: string;
  pid: number;
}): Promise<{ claimed: boolean }> => {
  const pidPath = getRouteReminderPidPath({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });
  await fs.mkdir(path.dirname(pidPath), { recursive: true });

  // claim the fixed pid path atomically; a lost race (claimed:false) means a handle already exists
  return claimExclusiveWrite({ path: pidPath, body: String(input.pid) });
};
