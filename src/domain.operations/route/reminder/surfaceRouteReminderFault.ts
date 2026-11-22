import { types } from 'util';

import { getRouteDriverCloneAddr } from './getRouteDriverCloneAddr';
import { getRouteReminderRepoRoot } from './getRouteReminderRepoRoot';
import { isToleratedIoWriteError } from './isToleratedIoWriteError';
import { setRouteReminderLogLine } from './setRouteReminderLogLine';

/**
 * .what = surfaces a benign (non-orphan) RouteReminder fault to a WATCHED channel, then returns so
 *         the drive proceeds.
 * .why = the auto-wire runs as a route.drive onBoot/onStop hook. a benign reminder fault (a spawn
 *        EACCES, a malformed pid handle, a focus write fault, a legacy handle the sweep could not
 *        reap) must NOT break the session — the reminder is an AUXILIARY continuity aid — but it
 *        must NOT hide either (rule.forbid.failhide). the hook's own stderr is not a human-watched
 *        surface; the clone's reminder LOG is (the daemon's own stdio redirects there), so the fault
 *        is written THERE.
 *
 * .why stderr floor = if the session's clone address is unreadable, or the log write ITSELF faults,
 *        stderr is the last-resort floor — it re-surfaces BOTH the original fault and the log-write
 *        fault, so no fault is ever hidden (rule.require.failloud). the reminder's one
 *        un-proceedable fault (a loose daemon) is NOT routed here — a RouteReminderOrphanError
 *        propagates from the caller instead.
 *
 * .note = `from` is any path the caller holds — a route, or the repo root itself. the log anchors
 *         on its repo root (getRouteReminderRepoRoot), the same anchor every clone handle uses
 */
export const surfaceRouteReminderFault = async (
  input: {
    from: string;
    error: unknown;
  },
  context: { stderr: (line: string) => void } = { stderr: console.error },
): Promise<void> => {
  // isNativeError, never `instanceof Error`: a node fs error from another vm realm fails `instanceof`,
  // and its String() form would prefix a raw `Error: ` to the line a human reads
  const detail = types.isNativeError(input.error)
    ? input.error.message
    : String(input.error);
  const line = `RouteReminder auto-sync fault (drive proceeds — continuity may be degraded): ${detail}`;

  // the session's own clone address keys the clone log; unreadable → stderr floor
  const driver = getRouteDriverCloneAddr();
  if (!driver) {
    context.stderr(line);
    return;
  }

  // write to the WATCHED clone reminder log; if THAT write faults, stderr is the floor
  const repoRoot = await getRouteReminderRepoRoot({ from: input.from });
  await setRouteReminderLogLine({
    repoRoot,
    cloneAddr: driver.cloneAddr,
    line,
  }).catch((logError: unknown) => {
    const logDetail = types.isNativeError(logError)
      ? logError.message
      : String(logError);

    // an EXPECTED io fault on the log write (no space, denied, read-only, vanished dir) is benign — the
    // original fault is still on the same stderr line, so no fault hides. a fault OUTSIDE that io class,
    // or a NON-errno throw (a real bug in the writer), is marked UNEXPECTED so a genuine defect stands
    // out (rule.forbid.failhide). we do NOT rethrow: this runs INSIDE the route.drive hook, so a throw
    // would break the drive over an auxiliary reminder.
    const tolerated = isToleratedIoWriteError({ error: logError });
    context.stderr(
      tolerated
        ? `${line} [also: reminder-log write faulted: ${logDetail}]`
        : `${line} [also: UNEXPECTED reminder-log write fault — likely a writer bug, not an io fault: ${logDetail}]`,
    );
  });
};
