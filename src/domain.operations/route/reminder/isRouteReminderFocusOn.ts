import * as path from 'path';

import { getRouteReminderFocus } from './getRouteReminderFocus';

/**
 * .what = whether a clone's RouteReminder focus names the given route now
 * .why = the focus is last-writer-wins across concurrent drives. a drive that would act on the
 *        daemon on behalf of one route (reap it, or let it exit) first checks the focus still names
 *        that route, so it never acts on a daemon a concurrent drive has since pointed elsewhere
 *
 * .note = the focus is stored absolute (setRouteReminderFocus), so the given route is absolutized
 *         before the compare
 */
export const isRouteReminderFocusOn = async (input: {
  repoRoot: string;
  cloneAddr: string;
  route: string;
}): Promise<boolean> => {
  const focus = await getRouteReminderFocus({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });
  return focus?.route === path.resolve(input.route);
};
