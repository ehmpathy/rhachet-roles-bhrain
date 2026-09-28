import { getRouteReminderHandlePath } from './getRouteReminderHandlePath';

/**
 * .what = the on-disk path of a route's RouteReminder daemon LOG file, per driver session
 * .why = a detached daemon has no terminal a human watches, so its stdout/stderr is redirected
 *        here. this is the observability seam the review flagged: when a daemon self-exits, its
 *        exit reason (`route-not-live` / `session-dead`) lands in this log, so an operator can
 *        read WHY a reminder went quiet instead of a bare vanished pid with no trace.
 *
 * .why = this delegates to the shared getRouteReminderHandlePath (ext='log') so the log handle and
 *        the pid handle cannot drift — they name the SAME per-session handle in two extensions, and
 *        one builder pins both to the same absolute `.route/` path and the same session token. the
 *        symmetry the log-beside-pid design depends on is now a structural guarantee, not a
 *        convention each builder had to re-apply (the review's decompose-for-recompose ask).
 */
export const getRouteReminderLogPath = (input: {
  route: string;
  cloneAddr: string;
}): string =>
  getRouteReminderHandlePath({
    route: input.route,
    cloneAddr: input.cloneAddr,
    ext: 'log',
  });
