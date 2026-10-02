import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';

import { isEEXIST } from '../guard/isEEXIST';
import {
  asReapClaimPath,
  delAbandonedDriveStateLock,
} from './delAbandonedDriveStateLock';
import { delOneFile } from './delOneFile';

/**
 * .what = how long an acquire may contend before it gives up LOUD
 * .why = the critical section is one read, one write, one rename — sub-millisecond — so this
 *        is ~500x headroom for a loaded host
 *
 * .note = one hook tick can take this lock twice (entry mark + block count), so its worst
 *         cost is 2 × itself inside the hook budget beside `WHOAMI_TIMEOUT_MS`. `[case4]`
 *         clamps that arithmetic against the settings on disk
 */
export const LOCK_ACQUIRE_TIMEOUT_MS = 500;

/**
 * .what = how long to rest between contended acquire attempts
 * .why = short enough that an uncontended handoff costs one tick of latency, long enough
 *        that a contended wait does not spin the event loop
 */
const LOCK_POLL_INTERVAL_MS = 5;

/**
 * .what = the on-disk path of the lock that guards a given state file
 * .why = exported so a test can hold the lock first without a hand-derived path
 */
export const asDriveStateLockPath = (input: { statePath: string }): string =>
  `${input.statePath}.lock`;

/**
 * .what = runs `critical` under an EXCLUSIVE, cross-process lock on a state file
 * .why = an atomic `rename` stops torn reads but not lost updates: two writers read one
 *        `before` and the second rename discards the first. a lost `count` under-arms the
 *        21-block cutoff; a lost `.stone` suppresses a brain dispatch that should have fired
 *        (`rule.forbid.behavior-hazards`)
 *
 * .how = `fs.open(path, 'wx')` (`O_CREAT | O_EXCL`) is granted to one caller; losers read
 *        EEXIST, rest, and retry until the deadline
 *
 * .note = no AGE-based steal: two writers could both judge one lock stale and double-unlink,
 *         a silent double grant. instead `delAbandonedDriveStateLock` reaps on the os's verdict
 *         (ESRCH from `kill(pid, 0)`) behind its own `wx` claim
 * .note = the lock file carries the holder's pid — the fact both the reap and a human's manual
 *         `rm` rest on
 */
export const withDriveStateLock = async <T>(input: {
  statePath: string;
  critical: () => Promise<T>;
}): Promise<T> => {
  const lockPath = asDriveStateLockPath({ statePath: input.statePath });

  // contend for the lock until the kernel grants it, or the deadline passes
  const handle = await (async (): Promise<fs.FileHandle> => {
    let deadline = Date.now() + LOCK_ACQUIRE_TIMEOUT_MS;
    let reapAttempted = false;

    for (;;) {
      try {
        return await fs.open(lockPath, 'wx');
      } catch (error) {
        // EEXIST = another writer holds it. every other code is a real fault
        if (!isEEXIST(error)) throw error;

        if (Date.now() >= deadline) {
          // at the deadline a live holder should have released, so try the reap — it parts a
          // dead holder from a live one by the os's answer, not by this inference
          if (!reapAttempted) {
            reapAttempted = true;
            const reaped = await delAbandonedDriveStateLock({ lockPath });
            // ONE extension, and only on a PROVEN reap. a `false` falls straight through to
            // the throw below, so a live holder never buys the contender a second window
            if (reaped) {
              deadline = Date.now() + LOCK_ACQUIRE_TIMEOUT_MS;
              continue;
            }
          }
          // a wedged lock, thrown with metadata so a consumer reads fields, not prose
          // (`rule.require.failloud`). the message keeps both `rm` lines for the human
          // (`rule.require.errors-name-the-fix`)
          throw new UnexpectedCodePathError(
            `could not acquire the drive-state lock at ${lockPath} within ` +
              `${LOCK_ACQUIRE_TIMEOUT_MS}ms, and its holder could not be proven gone. ` +
              'fix: read the file — it holds the pid that took the lock. if that ' +
              `process is gone, the hold was abandoned: rm ${lockPath}\n` +
              '      if a stale reap claim is also present, remove it too: ' +
              `rm ${asReapClaimPath({ lockPath })}`,
            {
              lockPath,
              reapClaimPath: asReapClaimPath({ lockPath }),
              timeoutMs: LOCK_ACQUIRE_TIMEOUT_MS,
              reapAttempted,
              hint: `read ${lockPath} for the holder's pid. if that process is gone, rm it — and rm ${asReapClaimPath(
                { lockPath },
              )} if a stale reap claim is present too`,
            },
          );
        }

        await new Promise((settle) =>
          setTimeout(settle, LOCK_POLL_INTERVAL_MS),
        );
      }
    }
  })();

  try {
    await handle.write(`${process.pid}\n`);
    return await input.critical();
  } finally {
    await handle.close();
    // release. an absent lock means someone already removed it by hand — not a fault
    await delOneFile({ path: lockPath });
  }
};
