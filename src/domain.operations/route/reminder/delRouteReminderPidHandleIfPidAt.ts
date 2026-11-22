import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';

/**
 * .what = removes a RouteReminder pid file ONLY if it still names `pid` — a compare-and-delete, at
 *         an explicit path
 * .why = an unconditional remove would delete whatever handle is on disk. between the moment a
 *        teardown read the live pid and the moment it removes the handle, a concurrent register can
 *        claim a FRESH handle (a new daemon, a new pid); an unconditional rm would then orphan that
 *        new daemon (rule.forbid.behavior-hazards). this removes the handle only when it STILL names
 *        the pid the caller stopped. the clone handle teardown and the legacy sweep share it
 *
 * returns whether the file was removed (`removed:true`) or left because it no longer named `pid`.
 *
 * .note = the read→compare→rm window is not a kernel-atomic compare-and-swap, but the rm can NEVER
 *         delete a handle that names a different pid than the one inspected here. an ENOENT at rm
 *         time (a concurrent remove) is a benign no-op; any other fault surfaces (rule.forbid.failhide)
 */
export const delRouteReminderPidHandleIfPidAt = async (input: {
  pidPath: string;
  pid: number;
}): Promise<{ removed: boolean }> => {
  // read the handle's CURRENT content. an absent file is already-gone → do not remove.
  const raw = await withEnoentAsNull(() => fs.readFile(input.pidPath, 'utf-8'));
  if (raw === null) return { removed: false };

  // the handle no longer names the stopped pid → a newer register claimed it → leave it intact
  if (raw.trim() !== String(input.pid)) return { removed: false };

  // the handle still names the stopped pid → safe to remove; a concurrent remove is a benign no-op
  await withEnoentAsNull(() => fs.rm(input.pidPath));
  return { removed: true };
};
