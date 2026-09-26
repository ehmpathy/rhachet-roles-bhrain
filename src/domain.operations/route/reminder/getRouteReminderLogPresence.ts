import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';

/**
 * .what = whether a session's RouteReminder daemon LOG file is present on disk — the "was a daemon
 *         EVER registered?" signal, independent of whether one is live now
 * .why = a bare "not live" read is ambiguous: the daemon may have NEVER registered, or it registered
 *        then self-exited/crashed. those two states need different operator moves (start one vs read
 *        why it went quiet), yet the pid handle alone cannot tell them apart — both a never-written
 *        and a reaped handle read as absent. the log file is the discriminator: spawnRouteReminderDaemon
 *        opens it (`fs.open(logPath, 'a')`) the moment a daemon spawns, and only the pid handle is
 *        reaped on del/reconcile — the log PERSISTS past self-exit. so a present log with an absent
 *        live handle proves "registered, then went quiet", and an absent log proves "never registered"
 *        (rule.require.status-feedback, rule.require.errors-name-the-fix).
 *
 * returns present:true iff the log file exists. ONLY an absent file (ENOENT) reads as present:false;
 * any other stat fault surfaces — an unreadable log is invalid state, never read as absence
 * (rule.forbid.failhide), the same ENOENT-only discipline readRouteReminderRawPid applies.
 */
export const getRouteReminderLogPresence = async (input: {
  route: string;
  cloneAddr: string;
}): Promise<{ present: boolean }> => {
  const logPath = getRouteReminderLogPath({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });

  // ONLY an absent file (ENOENT) reads as present:false; any other stat fault surfaces
  const stat = await withEnoentAsNull(() => fs.stat(logPath));

  return { present: stat !== null };
};
