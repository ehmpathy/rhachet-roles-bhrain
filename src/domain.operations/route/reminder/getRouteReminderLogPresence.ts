import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';

/**
 * .what = whether a clone's RouteReminder daemon LOG file is present on disk — the "was a daemon
 *         EVER registered?" signal, independent of whether one is live now
 * .why = a bare "not live" read is ambiguous: the daemon may have NEVER registered, or it registered
 *        then self-exited/crashed. the log file is the discriminator: spawnRouteReminderDaemon opens
 *        it the moment a daemon spawns, and only the pid handle is reaped on a halt — the log
 *        PERSISTS. so a present log with no live handle proves "registered, then went quiet", and an
 *        absent log proves "never registered" (rule.require.status-feedback)
 *
 * returns present:true iff the log file exists. ONLY an absent file (ENOENT) reads as present:false;
 * any other stat fault surfaces (rule.forbid.failhide).
 */
export const getRouteReminderLogPresence = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<{ present: boolean }> => {
  const logPath = getRouteReminderLogPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });

  // ONLY an absent file (ENOENT) reads as present:false; any other stat fault surfaces
  const stat = await withEnoentAsNull(() => fs.stat(logPath));

  return { present: stat !== null };
};
