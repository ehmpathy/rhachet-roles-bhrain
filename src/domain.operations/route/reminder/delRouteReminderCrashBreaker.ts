import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { getRouteReminderCrashBreakerPath } from './getRouteReminderCrashBreakerPath';

/**
 * .what = resets a clone's RouteReminder crash-breaker to zero (removes the state file)
 * .why = the breaker resets on any live daemon (a healthy boot proves the spawn works again) AND on a
 *        manual route.reminder.gen (a human re-arms auto-respawn after a fix). an absent state file IS
 *        count 0, so the reset is a plain idempotent remove. a concurrent remove (ENOENT) is a benign
 *        no-op; any other fault surfaces (rule.forbid.failhide)
 */
export const delRouteReminderCrashBreaker = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<void> => {
  const statePath = getRouteReminderCrashBreakerPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });

  // a concurrent remove (ENOENT) is a benign no-op; any other fault surfaces (rule.forbid.failhide)
  await withEnoentAsNull(() => fs.rm(statePath));
};
