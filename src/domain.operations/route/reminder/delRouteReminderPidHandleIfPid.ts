import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = removes a session's pid handle ONLY if it still names `pid` — a compare-and-delete
 * .why = an unconditional pid-handle remove would delete whatever handle is on disk. teardown must
 *        NOT do that: between the moment `delRouteReminder` read the live pid and the moment it
 *        removes the handle, a concurrent `genRouteReminder` for the SAME session can claim a
 *        FRESH handle (a new daemon, a new pid). an unconditional rm would then delete the NEW
 *        daemon's handle, left with an orphan of a live process that keeps its nudge cadence and
 *        can never be reaped — the exact anti-clog / no-residue hazard the feature exists to
 *        prevent (rule.forbid.behavior-hazards). this compare-and-delete removes the handle only
 *        when it STILL names the pid the caller stopped, so a raced-in newer handle is left intact.
 *
 * returns whether the handle was removed (`removed:true`) or left because it no longer named
 * `pid` — either gone already, or replaced by a newer claim (`removed:false`).
 *
 * .note = the read→compare→rm window is not a kernel-atomic compare-and-swap, but it collapses
 *         the race from the whole SIGTERM duration to the microseconds between this read and this
 *         rm, and — the property that carries the guarantee — the rm can NEVER delete a handle
 *         that names a different pid than the one inspected here. an ENOENT at rm time (a
 *         concurrent remove) is a benign no-op; any other fault surfaces (rule.forbid.failhide).
 */
export const delRouteReminderPidHandleIfPid = async (input: {
  route: string;
  cloneAddr: string;
  pid: number;
}): Promise<{ removed: boolean }> => {
  const pidPath = getRouteReminderPidPath({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });

  // read the handle's CURRENT content. an absent file is already-gone → do not remove.
  const raw = await withEnoentAsNull(() => fs.readFile(pidPath, 'utf-8'));
  if (raw === null) return { removed: false };

  // the handle no longer names the stopped pid → a newer register claimed it → leave it intact,
  // so this teardown can never orphan the daemon behind that newer handle.
  if (raw.trim() !== String(input.pid)) return { removed: false };

  // the handle still names the stopped pid → safe to remove. a concurrent remove (ENOENT) is a
  // benign no-op; any other fault surfaces.
  await withEnoentAsNull(() => fs.rm(pidPath));
  return { removed: true };
};
