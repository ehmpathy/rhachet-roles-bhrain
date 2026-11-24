import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { asStrictPositiveInteger } from './asStrictPositiveInteger';
import { RouteReminderPidMalformedError } from './RouteReminderPidMalformedError';

/**
 * .what = reads the pid a RouteReminder pid file NAMES, at an explicit path — parse only
 * .why = the clone handle read (readRouteReminderRawPid) and the legacy sweep (per-route handles
 *        that predate the clone home) must parse with ONE strict gate, so the gate lives here once
 *
 * the parse is STRICT: the file must be all-digits, edge to edge. a torn write like `123abc` must
 * throw, never parse to a plausible-but-wrong pid (rule.require.failfast).
 *
 * returns the named pid, or null when the file is absent (ENOENT). a malformed file throws —
 * invalid state is never read as absence (rule.forbid.failhide).
 */
export const readRouteReminderRawPidAt = async (input: {
  pidPath: string;
}): Promise<{ pid: number } | null> => {
  // ONLY an absent file (ENOENT) means "no handle". any other read fault must surface.
  const raw = await withEnoentAsNull(() => fs.readFile(input.pidPath, 'utf-8'));
  if (raw === null) return null;

  // a malformed pid file is INVALID STATE, not absence — fail loud, never read as "no handle"
  const pid = asStrictPositiveInteger({ raw });
  if (pid === null)
    throw new RouteReminderPidMalformedError(
      'RouteReminder pid file is malformed',
      {
        pidPath: input.pidPath,
        raw,
      },
    );

  return { pid };
};
