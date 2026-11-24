import * as path from 'path';

import { claimExclusiveWrite } from './claimExclusiveWrite';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';
import { setRouteReminderHandleDir } from './setRouteReminderHandleDir';

/**
 * .what = atomically claims a clone's pid handle — writes it ONLY if none exists yet
 * .why = the register findsert must be race-safe: two concurrent registers of the same clone (two
 *        routes driven at once, or a drive and a manual gen) must not both spawn a daemon. the
 *        exclusive-create (`wx`) write is the mutual exclusion — the filesystem itself elects ONE
 *        writer, so the loser learns it lost (claimed:false) and reaps its extra daemon. this is the
 *        atomic core of the one-daemon-per-clone guarantee (rule.forbid.behavior-hazards)
 *
 * .note = the `wx` protocol lives in claimExclusiveWrite (the shared primitive). a lost race reads
 *         as "a handle already existed — someone else claimed it, OR a stale handle survives; the
 *         caller reconciles which". any other write fault surfaces (rule.forbid.failhide)
 */
export const setRouteReminderPidHandle = async (input: {
  repoRoot: string;
  cloneAddr: string;
  pid: number;
}): Promise<{ claimed: boolean }> => {
  const pidPath = getRouteReminderPidPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });
  await setRouteReminderHandleDir({ dirPath: path.dirname(pidPath) });

  // claim the fixed pid path atomically; a lost race (claimed:false) means a handle already exists
  return claimExclusiveWrite({ path: pidPath, body: String(input.pid) });
};
