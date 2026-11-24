import { getRouteReminderHandlePath } from './getRouteReminderHandlePath';

/**
 * .what = the on-disk path of a clone's RouteReminder auto-respawn crash-breaker state
 * .why = the crash breaker is a per-clone handle, the same shape as the pid and log — a consecutive
 *        crash-on-arrival counter that trips auto-respawn. this delegates to the shared
 *        getRouteReminderHandlePath (ext='crashes') so the handles cannot drift on dir or clone key
 */
export const getRouteReminderCrashBreakerPath = (input: {
  repoRoot: string;
  cloneAddr: string;
}): string =>
  getRouteReminderHandlePath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
    ext: 'crashes',
  });
