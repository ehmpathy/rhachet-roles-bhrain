import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { getRouteReminderCrashBreakerPath } from './getRouteReminderCrashBreakerPath';
import { RouteReminderCrashBreaker } from './RouteReminderCrashBreaker';

/**
 * .what = reads a clone's RouteReminder auto-respawn crash-breaker count
 * .why = the auto-wire reads this before a respawn to decide whether the consecutive crash-on-arrival
 *        count has tripped the cutoff. the count IS the byte length of the append-only marker file:
 *        bumpRouteReminderCrashBreaker appends exactly one CRASH_MARKER_BYTE per crash (O_APPEND
 *        atomic), so stat.size is the streak length — no parse step. ONLY an absent file (ENOENT)
 *        means "no crashes recorded" (count 0); any OTHER read fault surfaces, never read as 0
 *        (rule.forbid.failhide) — a blanket-catch here would silently disable the spawn-storm cutoff.
 *
 * .note = the byte-count model has NO malformed-state failure mode: external garbage can only
 *         OVER-count, which trips the cutoff EARLY (fail-safe), never resets it to 0.
 */
export const getRouteReminderCrashBreaker = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<RouteReminderCrashBreaker> => {
  const statePath = getRouteReminderCrashBreakerPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });

  // ONLY an absent file (ENOENT) means "no crashes recorded". any other read fault must surface.
  const stat = await withEnoentAsNull(() => fs.stat(statePath));
  if (stat === null) return new RouteReminderCrashBreaker({ count: 0 });

  // the count is the marker-byte length — one byte appended per crash (the O_APPEND-atomic bump)
  return new RouteReminderCrashBreaker({ count: stat.size });
};
