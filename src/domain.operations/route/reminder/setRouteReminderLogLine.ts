import * as fs from 'fs/promises';
import * as path from 'path';

import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { setRouteReminderHandleDir } from './setRouteReminderHandleDir';

/**
 * .what = appends one line to a clone's RouteReminder log
 * .why = the clone log is the watched surface for the reminder: the daemon's stdio lands there, and
 *        the drive hook writes its faults and its legacy reaps there. one writer owns the dir findsert
 *        and the append, so no caller re-inlines either
 *
 * .note = intrinsically an append, the same as setPassageReport: a log records each event once per
 *         occurrence, so a re-run that repeats the event repeats the line. the line is the record
 *
 * .note = a write fault throws; each caller decides how to surface it (surfaceRouteReminderFault
 *         falls back to stderr)
 */
export const setRouteReminderLogLine = async (input: {
  repoRoot: string;
  cloneAddr: string;
  line: string;
}): Promise<void> => {
  const logPath = getRouteReminderLogPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });
  await setRouteReminderHandleDir({ dirPath: path.dirname(logPath) });
  await fs.appendFile(logPath, `${input.line}\n`);
};
