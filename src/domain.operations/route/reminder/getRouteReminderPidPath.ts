import { getRouteReminderHandlePath } from './getRouteReminderHandlePath';

/**
 * .what = the on-disk path of a clone's RouteReminder daemon pid file
 * .why = the pid file is the daemon's handle — an inert pointer to one process per clone. this
 *        delegates to the shared getRouteReminderHandlePath (ext='pid') so the pid, log, crash, and
 *        focus handles cannot drift on dir or clone key
 */
export const getRouteReminderPidPath = (input: {
  repoRoot: string;
  cloneAddr: string;
}): string =>
  getRouteReminderHandlePath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
    ext: 'pid',
  });
