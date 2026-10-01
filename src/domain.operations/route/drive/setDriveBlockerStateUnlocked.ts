import * as fs from 'node:fs/promises';
import {
  asDriveBlockerStatePath,
  type DriveBlockerState,
} from './DriveBlocker';

/**
 * .what = writes a route's `DriveBlockerState` to disk ATOMICALLY, and takes NO lock
 * .why = `mutateDriveBlockerState` and `delDriveBlockerState` each write inside a lock they
 *        already hold, and `withDriveStateLock` is NOT reentrant (a nested `wx` open would
 *        EEXIST against the caller's own hold). so the write composes; the lock does not
 *
 * 🔴 .note = the caller MUST already hold the drive-state lock. the `Unlocked` suffix puts
 *           that contract at the call site, where a bare name would read as safe
 *           (`rule.require.pitofsuccess`)
 * .note = temp + `fs.rename`, because `fs.writeFile` is not atomic: a concurrent reader
 *           sees the whole old file or the whole new one, never a torn one
 * .note = the pid in the temp path parts writers across PROCESSES; the lock parts them
 *         within one. the two guard different things
 */
export const setDriveBlockerStateUnlocked = async (input: {
  route: string;
  state: DriveBlockerState;
}): Promise<void> => {
  const statePath = asDriveBlockerStatePath({ route: input.route });
  const tempPath = `${statePath}.${process.pid}.tmp`;

  try {
    await fs.writeFile(tempPath, JSON.stringify(input.state, null, 2));
    await fs.rename(tempPath, statePath);
  } finally {
    // a no-op on the happy path (the rename consumed the temp); a cleanup that threw
    // would replace the caller's real cause with its own
    await fs.unlink(tempPath).catch(() => undefined);
  }
};
