import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { asStrictPositiveInteger } from './asStrictPositiveInteger';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = reads the pid a session's handle NAMES, with no liveness probe — parse only
 * .why = two callers need the raw pid on the handle, not the "is it live" verdict: `getRouteReminder`
 *        (which then probes liveness) and the register reconcile (which compare-and-deletes a STALE
 *        handle keyed on the pid it named). one strict parser serves both, so the edge-to-edge gate
 *        is declared once (rule.prefer.wet-over-dry), never re-rolled per caller.
 *
 * the parse is STRICT: the handle must be all-digits, edge to edge. `Number.parseInt` reads a
 * numeric prefix and drops the rest, so a torn write like `123abc` / `12 34` would parse to a
 * plausible-but-wrong pid and pass a bare integer guard — the exact silent-continuation-on-bad-input
 * the failfast clause forbids. a `/^\d+$/` gate makes ANY corruption throw (rule.require.failfast).
 *
 * returns the named pid, or null when the handle is absent (ENOENT). a malformed handle throws —
 * invalid state is never read as absence (rule.forbid.failhide).
 */
export const readRouteReminderRawPid = async (input: {
  route: string;
  cloneAddr: string;
}): Promise<{ pid: number } | null> => {
  const pidPath = getRouteReminderPidPath({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });

  // ONLY an absent file (ENOENT) means "no handle". any other read fault must surface.
  const raw = await withEnoentAsNull(() => fs.readFile(pidPath, 'utf-8'));
  if (raw === null) return null;

  // a malformed pid file is INVALID STATE, not absence — fail loud, never read as "no handle".
  // the strict all-digits gate is the SAME transformer the cli numeric flags use (one home for the
  // edge-to-edge parse); a null verdict here is a torn handle, an internal-invariant violation.
  const pid = asStrictPositiveInteger({ raw });
  if (pid === null)
    throw new UnexpectedCodePathError('RouteReminder pid file is malformed', {
      pidPath,
      raw,
    });

  return { pid };
};
