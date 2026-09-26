import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { getRouteReminderLogPath } from './getRouteReminderLogPath';

/**
 * .what = removes a driver session's RouteReminder per-session daemon log
 * .why = the log PERSISTS past a self-exit / crash by design, so `get` can discriminate a death from
 *        a never-registered session (getRouteReminderLogPresence). a DELIBERATE teardown (delRouteReminder)
 *        is neither death nor absence — the operator turned it off on purpose, so the death evidence must
 *        clear, else `get` misreads the deliberate stop as a crash. this idempotent remove clears the log
 *        as part of that teardown. a concurrent remove (ENOENT) is a benign no-op; any other fault
 *        surfaces (rule.forbid.failhide). mirrors delRouteReminderCrashBreaker.
 */
export const delRouteReminderLog = async (input: {
  route: string;
  cloneAddr: string;
}): Promise<void> => {
  const logPath = getRouteReminderLogPath({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });

  // a concurrent remove (ENOENT) is a benign no-op; any other fault surfaces (rule.forbid.failhide)
  await withEnoentAsNull(() => fs.rm(logPath));
};
