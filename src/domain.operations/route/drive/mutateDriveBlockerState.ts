import * as fs from 'fs/promises';
import * as path from 'path';

import {
  asDriveBlockerStatePath,
  type DriveBlockerState,
} from './DriveBlocker';
import { getDriveBlockerState } from './getDriveBlockerState';
import { setDriveBlockerStateUnlocked } from './setDriveBlockerStateUnlocked';
import { withDriveStateLock } from './withDriveStateLock';

/**
 * .what = the ONE read-modify-write of a route's `DriveBlockerState`: read, project, write
 *         back atomically
 * .why = two writers share the file — `setDriveBlockerState` (block count) and
 *        `setDriveEntryStone` (entered stone) — and both feed live decisions, so one cycle
 *        rather than two hand-written copies
 *
 * .note = the write is temp + `fs.rename` (via `setDriveBlockerStateUnlocked`): a torn read
 *         would degrade to FRESH state and silently reset the 21-block cutoff and the entry
 *         marker
 * .note = the whole cycle runs under `withDriveStateLock`: the rename makes each write whole,
 *         the lock makes read-and-write one act, so no concurrent update is lost
 * .note = the temp's pid suffix parts two PROCESSES; the lock parts two writers in one
 * .note = `project` is a pure transform, so each caller states only what it changes
 */
export const mutateDriveBlockerState = async (input: {
  route: string;
  project: (before: DriveBlockerState) => DriveBlockerState;
}): Promise<{ state: DriveBlockerState }> => {
  const routeDir = path.join(input.route, '.route');
  const statePath = asDriveBlockerStatePath({ route: input.route });

  // ensure .route dir exists, outside the lock: the lock file lives in this dir
  await fs.mkdir(routeDir, { recursive: true });

  return await withDriveStateLock({
    statePath,
    critical: async () => {
      const before = await getDriveBlockerState({ route: input.route });
      const after = input.project(before);

      await setDriveBlockerStateUnlocked({ route: input.route, state: after });

      return { state: after };
    },
  });
};
