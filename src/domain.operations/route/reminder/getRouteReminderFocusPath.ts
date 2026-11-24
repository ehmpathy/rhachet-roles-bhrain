import { getRouteReminderHandlePath } from './getRouteReminderHandlePath';

/**
 * .what = the on-disk path of a clone's RouteReminder focus pointer
 * .why = the focus names the route the clone drives now. the drive writes it; the daemon reads it
 *        each tick. this delegates to the shared getRouteReminderHandlePath (ext='focus') so the
 *        focus sits beside the pid it steers, keyed on the same clone
 */
export const getRouteReminderFocusPath = (input: {
  repoRoot: string;
  cloneAddr: string;
}): string =>
  getRouteReminderHandlePath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
    ext: 'focus',
  });
