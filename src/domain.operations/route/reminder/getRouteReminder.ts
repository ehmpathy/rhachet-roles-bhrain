import { isProcessAlive } from './isProcessAlive';
import { readRouteReminderRawPid } from './readRouteReminderRawPid';

/**
 * .what = detects whether a driver session's RouteReminder daemon is set and live
 * .why = the "is it set?" read behind findsert (register) and the human status view. it is a
 *        pure file read + a `kill -0` liveness probe — deterministic, no process-table scan.
 *        a stale pid file (left by a crash) reads as NOT set: `kill -0` fails, so the handle is
 *        a dead pointer the next register overwrites, never a false "already live".
 *
 * .note = per-session scope: the handle is keyed by route AND cloneAddr, so this detects the
 *         reminder for THIS driver session, not any session on the route (vision Q10 / wish).
 *
 * returns the live pid, or null when no daemon is set (absent file, or a stale/dead pid).
 */
export const getRouteReminder = async (input: {
  route: string;
  cloneAddr: string;
}): Promise<{ pid: number } | null> => {
  // read the pid the handle names (strict parse; a torn/garbage handle throws, never reads as
  // "not set" — to read a corrupt handle as absent would spawn a SECOND daemon while the first
  // still runs, the exact U3 anti-clog hazard). an absent handle is null = "not set".
  const named = await readRouteReminderRawPid({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });
  if (named === null) return null;

  // probe liveness: a live pid is a live daemon; a dead/stale pid is "not set" (the next
  // register reconciles the stale handle). the isProcessAlive communicator owns the kill -0
  // idiom + errno allowlist (ESRCH → dead; other errno → real fault surfaces).
  return isProcessAlive({ pid: named.pid }) ? { pid: named.pid } : null;
};
