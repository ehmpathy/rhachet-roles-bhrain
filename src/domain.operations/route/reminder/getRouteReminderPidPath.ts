import { getRouteReminderHandlePath } from './getRouteReminderHandlePath';

/**
 * .what = the on-disk path of a route's RouteReminder daemon pid file, per driver session
 * .why = the pid file is the daemon's handle — an inert pointer co-located with the
 *        passage.jsonl the daemon reads. this delegates to the shared getRouteReminderHandlePath
 *        (ext='pid') so the pid and log handles cannot drift on dir, session key, or the
 *        absolute-path guard — one builder decides all three (see getRouteReminderHandlePath).
 */
export const getRouteReminderPidPath = (input: {
  route: string;
  cloneAddr: string;
}): string =>
  getRouteReminderHandlePath({
    route: input.route,
    cloneAddr: input.cloneAddr,
    ext: 'pid',
  });
