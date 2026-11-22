import * as fs from 'fs/promises';
import * as path from 'path';

import { CRASH_MARKER_BYTE } from './CRASH_MARKER_BYTE';
import { getRouteReminderCrashBreaker } from './getRouteReminderCrashBreaker';
import { getRouteReminderCrashBreakerPath } from './getRouteReminderCrashBreakerPath';
import type { RouteReminderCrashBreaker } from './RouteReminderCrashBreaker';
import { setRouteReminderHandleDir } from './setRouteReminderHandleDir';

/**
 * .what = records ONE more consecutive crash-on-arrival for a clone's RouteReminder, returns the
 *         new count.
 * .why = the auto-wire calls this each time a FRESH spawn dies on arrival, so the persisted count
 *        climbs toward the cutoff (MAX_ROUTE_REMINDER_CRASHES). once it exceeds the cutoff the
 *        auto-wire halts the respawn — the spawn-storm guard. per clone: a broken spawn trips once,
 *        never once per route
 *
 * .note = ATOMIC by construction — a single-byte append (O_APPEND), NOT a read-modify-write, so two
 *         concurrent bumps each add their own byte and NO increment is lost
 *         (rule.forbid.behavior-hazards). the count IS the byte length (getRouteReminderCrashBreaker)
 */
export const bumpRouteReminderCrashBreaker = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<{ state: RouteReminderCrashBreaker }> => {
  const statePath = getRouteReminderCrashBreakerPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });

  // the state file lives in the clone handle dir; ensure it exists and ignores itself (idempotent)
  await setRouteReminderHandleDir({ dirPath: path.dirname(statePath) });

  // append ONE marker byte for this crash — O_APPEND lands each write atomically at EOF
  await fs.appendFile(statePath, CRASH_MARKER_BYTE);

  // the new count is the authoritative post-append read (the byte length)
  const state = await getRouteReminderCrashBreaker({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });
  return { state };
};
