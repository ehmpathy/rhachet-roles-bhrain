import * as fs from 'fs/promises';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { getRouteReminderFocusPath } from './getRouteReminderFocusPath';

/**
 * .what = reads the route a clone's RouteReminder is pointed at
 * .why = the daemon's tick reads it to learn which route to judge; `route.reminder.get` reads it to
 *        name the route the reminder watches, and why it halted, even after the daemon was reaped
 *
 * returns the absolute route path, or null when no focus was ever written (ENOENT) or the file is
 * empty. any other read fault surfaces (rule.forbid.failhide).
 */
export const getRouteReminderFocus = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<{ route: string } | null> => {
  const focusPath = getRouteReminderFocusPath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });

  // ONLY an absent file (ENOENT) means "no focus". any other read fault must surface.
  const raw = await withEnoentAsNull(() => fs.readFile(focusPath, 'utf-8'));
  const route = raw?.trim() ?? '';
  if (!route) return null;
  return { route };
};
