import * as fs from 'fs/promises';

import { asNodeErrnoCode } from '../asNodeErrnoCode';
import { getRouteDriverCloneAddr } from './getRouteDriverCloneAddr';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { TOLERATED_IO_WRITE_ERRNOS } from './TOLERATED_IO_WRITE_ERRNOS';

/**
 * .what = surfaces a benign (non-orphan) RouteReminder auto-sync fault to a WATCHED channel, then
 *         returns so the drive proceeds.
 * .why = the auto-wire runs as a route.drive onBoot/onStop hook. a benign reminder fault (a spawn
 *        EACCES, a malformed pid handle, a torn passage line, a non-convergent claim) must NOT break
 *        the session — the reminder is an AUXILIARY continuity aid — but it must NOT hide either
 *        (rule.forbid.failhide). the hook's own stderr is not a human-watched surface; the
 *        per-session reminder LOG is (the daemon's own stdio redirects there), so the fault is
 *        written THERE. this is the "surface to a per-session/reminder channel" the failhide review
 *        asked for, in place of a swallow to an unwatched hook stderr.
 *
 * .why stderr floor = if the session's clone address is unreadable, or the per-session log write
 *        ITSELF faults, stderr is the last-resort floor — it re-surfaces BOTH the original fault and
 *        the log-write fault, so no fault is ever hidden (rule.require.failloud). the reminder's one
 *        un-proceedable fault (a loose daemon) is NOT routed here — a RouteReminderOrphanError
 *        propagates from the caller instead.
 */
export const surfaceRouteReminderFault = async (
  input: {
    route: string;
    error: unknown;
  },
  context: { stderr: (line: string) => void } = { stderr: console.error },
): Promise<void> => {
  const detail =
    input.error instanceof Error ? input.error.message : String(input.error);
  const line = `RouteReminder auto-sync fault (drive proceeds — continuity may be degraded): ${detail}`;

  // the session's own clone address keys the per-session log; unreadable → stderr floor
  const driver = getRouteDriverCloneAddr();
  if (!driver) {
    context.stderr(line);
    return;
  }

  // write to the WATCHED per-session reminder log; if THAT write faults, stderr is the floor
  const logPath = getRouteReminderLogPath({
    route: input.route,
    cloneAddr: driver.cloneAddr,
  });
  await fs.appendFile(logPath, `${line}\n`).catch((logError: unknown) => {
    const logDetail =
      logError instanceof Error ? logError.message : String(logError);
    const errno = asNodeErrnoCode(logError);

    // an EXPECTED io fault on the log write (no space, denied, read-only, vanished dir) is benign — the
    // original fault is still on the same stderr line, so no fault hides. a fault OUTSIDE that io class,
    // or a NON-errno throw (a real bug in the writer), is NOT laundered as a routine log-write fault: it
    // is marked UNEXPECTED so a genuine defect stands out (rule.forbid.failhide — allowlist the class,
    // surface the rest). we do NOT rethrow: this runs INSIDE the route.drive hook, so a throw would
    // break the user's drive over an auxiliary reminder — unlike runRouteReminderDaemon's crash-log
    // write, which lives in the disposable daemon and CAN rethrow. so "surface the rest" here is a
    // distinct, loud stderr line, never a throw.
    const tolerated =
      errno !== undefined && TOLERATED_IO_WRITE_ERRNOS.includes(errno);
    context.stderr(
      tolerated
        ? `${line} [also: reminder-log write faulted (${errno}): ${logDetail}]`
        : `${line} [also: UNEXPECTED reminder-log write fault — likely a writer bug, not an io fault: ${logDetail}]`,
    );
  });
};
