import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { getRouteReminderCrashBreakerPath } from './getRouteReminderCrashBreakerPath';

/**
 * .what = resets a driver session's RouteReminder crash-breaker to zero (removes the state file)
 * .why = the breaker resets on any live daemon (a healthy boot proves the spawn works again) AND on a
 *        manual route.reminder.gen (a human re-arms auto-respawn after a fix). an absent state file IS
 *        count 0 (getRouteReminderCrashBreaker), so the reset is a plain idempotent remove — no need to
 *        write a zero. a concurrent remove (ENOENT) is a benign no-op; any other fault surfaces
 *        (rule.forbid.failhide). mirrors delDriveBlockerState (the drive's own block-count reset).
 */
export const delRouteReminderCrashBreaker = async (input: {
  route: string;
  cloneAddr: string;
}): Promise<void> => {
  const statePath = getRouteReminderCrashBreakerPath({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });

  // a concurrent remove (ENOENT) is a benign no-op; any other fault surfaces (rule.forbid.failhide)
  await withEnoentAsNull(() => fs.rm(statePath));
};
