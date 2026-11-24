import { isProcessAlive } from './isProcessAlive';
import { readRouteReminderRawPid } from './readRouteReminderRawPid';

/**
 * .what = detects whether a clone's RouteReminder daemon is set and live
 * .why = the "is it set?" read behind findsert (register) and the human status view. it is a
 *        pure file read + a `kill -0` liveness probe — deterministic, no process-table scan.
 *        a stale pid file (left by a crash) reads as NOT set: `kill -0` fails, so the handle is
 *        a dead pointer the next register overwrites, never a false "already live".
 *
 * .note = keyed on the clone alone: one daemon per clone, whatever routes it has driven.
 *
 * returns the live pid, or null when no daemon is set (absent file, or a stale/dead pid).
 */
export const getRouteReminder = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<{ pid: number } | null> => {
  // read the pid the handle names (strict parse; a torn handle throws, never reads as "not set" —
  // to read a corrupt handle as absent would spawn a SECOND daemon while the first still runs)
  const named = await readRouteReminderRawPid({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });
  if (named === null) return null;

  // probe liveness: a live pid is a live daemon; a dead/stale pid is "not set"
  return isProcessAlive({ pid: named.pid }) ? { pid: named.pid } : null;
};
