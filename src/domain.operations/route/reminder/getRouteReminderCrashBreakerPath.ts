import { getRouteReminderHandlePath } from './getRouteReminderHandlePath';

/**
 * .what = the on-disk path of a route's RouteReminder auto-respawn crash-breaker state, per session
 * .why = the crash breaker is a per-session handle, the same shape as the pid and log — a consecutive
 *        crash-on-arrival counter that trips auto-respawn. this delegates to the shared
 *        getRouteReminderHandlePath (ext='crashes') so the crash-breaker, pid, and log handles cannot
 *        drift on dir, session key, or the absolute-path guard — one builder decides all three
 *        (see getRouteReminderHandlePath).
 */
export const getRouteReminderCrashBreakerPath = (input: {
  route: string;
  cloneAddr: string;
}): string =>
  getRouteReminderHandlePath({
    route: input.route,
    cloneAddr: input.cloneAddr,
    ext: 'crashes',
  });
