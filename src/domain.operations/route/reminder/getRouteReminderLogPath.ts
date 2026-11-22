import { getRouteReminderHandlePath } from './getRouteReminderHandlePath';

/**
 * .what = the on-disk path of a clone's RouteReminder daemon LOG file
 * .why = a detached daemon has no terminal a human watches, so its stdout/stderr is redirected
 *        here. when a daemon self-exits, its exit reason (`route-not-live` / `session-dead`) lands
 *        in this log, so an operator can read WHY a reminder went quiet
 *
 * .note = this delegates to the shared getRouteReminderHandlePath (ext='log') so the log and the
 *         pid handle name ONE per-clone handle in two extensions, never two drifted paths
 */
export const getRouteReminderLogPath = (input: {
  repoRoot: string;
  cloneAddr: string;
}): string =>
  getRouteReminderHandlePath({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
    ext: 'log',
  });
