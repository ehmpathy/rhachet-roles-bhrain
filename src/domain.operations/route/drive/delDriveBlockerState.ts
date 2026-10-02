import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { asDriveBlockerStatePath, DriveBlockerState } from './DriveBlocker';
import { getDriveBlockerState } from './getDriveBlockerState';
import { setDriveBlockerStateUnlocked } from './setDriveBlockerStateUnlocked';
import { withDriveStateLock } from './withDriveStateLock';

/**
 * .what = clears the drive BLOCK STREAK on passage — the count and the block attribution
 * .why = progress was made, so the 21-block stuck cutoff re-arms from zero
 *
 * .note = not a plain unlink: the file also carries the route's last dispatched brain and the
 *         stone that prescribed it (`DriveBrainInheritance`), and passage is the exact boundary
 *         that attribution must cross — case=7's line renders on the brainless stone AFTER a
 *         switch. so an opted-in route resets the streak and keeps the brain (`F16`)
 * .note = a route with no brain still unlinks, so a route that never opted in writes no new
 *         artifact on passage (case=10)
 * .note = the whole decide-and-act, read included, runs under ONE lock: an unlocked read would
 *         let a concurrent `setDriveEntryStone` land a fresh brain the unlink then erases
 *         (`rule.forbid.behavior-hazards`). it cannot delegate to `mutateDriveBlockerState`,
 *         which takes the lock itself — `withDriveStateLock` is not reentrant (`wx`) — so both
 *         share `setDriveBlockerStateUnlocked` for the atomic write
 * .note = no try/catch: absences are absorbed one layer down (`getOneFileText` → ENOENT,
 *         `fs.rm` `force: true`), so what remains is a corrupt file or a dead holder's lock,
 *         each thrown loud with its repair (`rule.forbid.failhide`)
 */
export const delDriveBlockerState = async (input: {
  route: string;
}): Promise<void> => {
  const statePath = asDriveBlockerStatePath({ route: input.route });

  // outside the lock: the lock file lives in this dir
  await fs.mkdir(path.join(input.route, '.route'), { recursive: true });

  await withDriveStateLock({
    statePath,
    critical: async () => {
      // an opted-in route carries an attribution that outlives the streak — reset, never erase
      const before = await getDriveBlockerState({ route: input.route });

      if (before.brain) {
        await setDriveBlockerStateUnlocked({
          route: input.route,
          state: new DriveBlockerState({
            count: 0,
            stone: null,
            brain: before.brain,
          }),
        });
        return;
      }

      await fs.rm(statePath, { force: true });
    },
  });
};
