import * as path from 'path';

import { asRouteReminderSessionToken } from './asRouteReminderSessionToken';

/**
 * .what = the on-disk path of a route's per-session RouteReminder daemon handle, for one extension
 * .why = the pid handle, the log handle, and the crash-breaker state are the SAME per-session handle
 *        in three extensions — all sit in the route's own `.route/` dir, all keyed by the same
 *        injective session token, differ only by `.pid` vs `.log` vs `.crashes`. one builder makes
 *        that symmetry a STRUCTURAL guarantee, not a convention three separate builders each had to
 *        remember: the paths cannot drift on where the handle lives, how the session is keyed, or
 *        whether the route is pinned absolute, because there is exactly one place that decides all
 *        three (the same decompose-for-recompose discipline `getRouteDriveFrontier` and the shared
 *        `asNodeErrnoCode` apply — one builder every consumer delegates to).
 *
 * .note = `.crashes` holds the consecutive crash-on-arrival counter (the auto-respawn circuit
 *         breaker). per-session, exactly like the pid/log, so one broken session's breaker never
 *         stomps another's — a systematically-broken spawn trips only its own session's cutoff.
 *
 * .note = the route is pinned ABSOLUTE (path.resolve against the caller's cwd) so register, detect,
 *         and deregister all key BOTH handles on ONE canonical path — never a mix of a relative `.`
 *         from one caller and an absolute form from another, which would split one daemon's pid (or
 *         log) across two files and defeat the one-log observability the reminder is built around.
 *         spawnRouteReminderDaemon applies the same absolute-path guard to the daemon's own route
 *         arg; here it is applied ONCE for both handle kinds (defense in depth; a no-op under the
 *         cwd=gitroot convention, a guarantee at this boundary regardless).
 *
 * .note = per-session scope (the wish's "per session scope is desired", vision Q10): the handle is
 *         keyed by BOTH the route AND the driver session (its cloneAddr). when two sessions drive
 *         one route, each holds a distinct handle, so neither stomps the other. the
 *         `daemon.of=<what>` shape groups any future route-local daemon handle under one `daemon.*`
 *         prefix.
 */
export const getRouteReminderHandlePath = (input: {
  route: string;
  cloneAddr: string;
  ext: 'pid' | 'log' | 'crashes';
}): string =>
  path.join(
    path.resolve(input.route),
    '.route',
    `daemon.of=reminder-driveon.session=${asRouteReminderSessionToken({
      cloneAddr: input.cloneAddr,
    })}.${input.ext}`,
  );
