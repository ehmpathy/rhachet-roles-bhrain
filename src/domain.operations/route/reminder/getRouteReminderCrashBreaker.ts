import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { getRouteReminderCrashBreakerPath } from './getRouteReminderCrashBreakerPath';
import { RouteReminderCrashBreaker } from './RouteReminderCrashBreaker';

/**
 * .what = reads a driver session's RouteReminder auto-respawn crash-breaker count
 * .why = the auto-wire reads this before a respawn to decide whether the consecutive crash-on-arrival
 *        count has tripped the cutoff. the count IS the byte length of the append-only marker file:
 *        bumpRouteReminderCrashBreaker appends exactly one CRASH_MARKER_BYTE per crash (O_APPEND
 *        atomic), so stat.size is the streak length — no parse step. ONLY an absent file (ENOENT)
 *        means "no crashes recorded" (count 0) — a re-arm deletes the file, so absent == 0 by design.
 *        any OTHER read fault (EACCES, EPERM) is a real fault that surfaces, never read as 0
 *        (rule.forbid.failhide) — a blanket-catch here would silently disable the spawn-storm cutoff.
 *        mirrors readRouteReminderRawPid (the same ENOENT-allowlist gate on the pid handle).
 *
 * .note = the byte-count model has NO malformed-state failure mode (the old json { count } could be
 *         torn or non-integer; a byte file of length N is unambiguously N crashes). external garbage
 *         written into the file can only OVER-count — which trips the cutoff EARLY (fail-safe: halts
 *         respawn), never silently resets it to 0. so the "corruption must not disable the cutoff"
 *         invariant the fail-loud json guard used to enforce is now upheld BY CONSTRUCTION.
 */
export const getRouteReminderCrashBreaker = async (input: {
  route: string;
  cloneAddr: string;
}): Promise<RouteReminderCrashBreaker> => {
  const statePath = getRouteReminderCrashBreakerPath({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });

  // ONLY an absent file (ENOENT) means "no crashes recorded". any other read fault must surface.
  const stat = await withEnoentAsNull(() => fs.stat(statePath));
  if (stat === null) return new RouteReminderCrashBreaker({ count: 0 });

  // the count is the marker-byte length — one byte appended per crash (the O_APPEND-atomic bump)
  return new RouteReminderCrashBreaker({ count: stat.size });
};
