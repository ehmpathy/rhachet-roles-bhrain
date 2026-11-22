import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';

/**
 * .what = removes a clone's RouteReminder daemon log
 * .why = the log PERSISTS past a self-exit / crash by design, so `get` can discriminate a death from
 *        a never-registered clone (getRouteReminderLogPresence). a DELIBERATE teardown by a human
 *        (route.reminder.del) is neither death nor absence, so the death evidence must clear, else
 *        `get` misreads the deliberate stop as a crash. a concurrent remove (ENOENT) is a benign
 *        no-op; any other fault surfaces (rule.forbid.failhide)
 */
export const delRouteReminderLog = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<void> => {
  const logPath = getRouteReminderLogPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });

  // a concurrent remove (ENOENT) is a benign no-op; any other fault surfaces (rule.forbid.failhide)
  await withEnoentAsNull(() => fs.rm(logPath));
};
