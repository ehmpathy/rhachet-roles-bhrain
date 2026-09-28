import * as fs from 'fs/promises';
import * as path from 'path';

import { CRASH_MARKER_BYTE } from './CRASH_MARKER_BYTE';
import { getRouteReminderCrashBreaker } from './getRouteReminderCrashBreaker';
import { getRouteReminderCrashBreakerPath } from './getRouteReminderCrashBreakerPath';
import type { RouteReminderCrashBreaker } from './RouteReminderCrashBreaker';

/**
 * .what = records ONE more consecutive crash-on-arrival for a driver session's RouteReminder,
 *         returns the new count.
 * .why = the auto-wire calls this each time a FRESH spawn dies on arrival, so the persisted count
 *        climbs toward the cutoff (MAX_ROUTE_REMINDER_CRASHES). once it exceeds the cutoff the
 *        auto-wire halts the respawn — the spawn-storm guard.
 *
 * .note = ATOMIC by construction — a single-byte append (O_APPEND), NOT a read-modify-write. each
 *         crash appends exactly one CRASH_MARKER_BYTE via fs.appendFile (flag 'a' = O_APPEND), so
 *         the kernel lands every write at EOF; two concurrent bumps (two route.drive hooks that fire
 *         near-together, or a drive that races a manual route.reminder.gen) each add their own byte
 *         and NO increment is lost. the count IS the byte length (getRouteReminderCrashBreaker reads
 *         it back). this replaces the old read-count → +1 → overwrite, whose overlap could drop an
 *         increment and UNDER-count the streak at the exact moment a concurrent spawn-storm makes the
 *         cutoff need to latch (rule.forbid.behavior-hazards — no unguarded read-modify-write). it is
 *         the append-twin of setRouteReminderCrashLog's `wx` slot claim: both atomic-by-construction,
 *         each suited to its lifecycle — the crash LOG is a permanent monotonic audit (wx per index),
 *         the crash BREAKER is a reset-able streak (append markers, truncated whole by
 *         delRouteReminderCrashBreaker on any healthy boot).
 */
export const bumpRouteReminderCrashBreaker = async (input: {
  route: string;
  cloneAddr: string;
}): Promise<{ state: RouteReminderCrashBreaker }> => {
  const statePath = getRouteReminderCrashBreakerPath({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });

  // the state file lives in the route's .route dir; ensure it exists (idempotent)
  await fs.mkdir(path.dirname(statePath), { recursive: true });

  // append ONE marker byte for this crash — O_APPEND lands each write atomically at EOF, so a
  // concurrent bump never clobbers this one (no read-modify-write, no lost increment)
  await fs.appendFile(statePath, CRASH_MARKER_BYTE);

  // the new count is the authoritative post-append read (the byte length) — it counts any concurrent
  // append too, so the caller sees the true current streak, not a stale local guess
  const state = await getRouteReminderCrashBreaker({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });
  return { state };
};
