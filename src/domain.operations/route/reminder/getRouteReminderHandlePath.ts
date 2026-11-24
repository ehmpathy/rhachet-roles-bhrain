import * as path from 'path';

import { asRouteReminderHandleStem } from './asRouteReminderHandleStem';

/**
 * .what = the dir that holds every clone's RouteReminder handle, relative to the repo root — the
 *         "clone home" the reminder comments name
 * .why = one home for the join, so the path builder, the gitignore findsert, and any reader
 *        cannot type it two ways. it sits under `.agent/.cache/` (gitignored), beside the
 *        status-line cache (`DIR_OF_ROUTE_STATUS_LINE_CACHE`), in the same coordinate shape
 */
export const DIR_OF_ROUTE_REMINDER_HANDLES = path.join(
  '.agent',
  '.cache',
  'repo=bhrain',
  'role=driver',
  'skill=route.reminder',
);

/**
 * .what = the on-disk path of a clone's RouteReminder daemon handle, for one extension
 * .why = the pid, the log, the crash-breaker, and the focus pointer are ONE per-clone handle in
 *        four extensions. one builder makes that symmetry structural: the paths cannot drift on
 *        where the handle lives or how the clone is keyed
 *
 * .note = keyed on the CLONE alone, never on the route. a clone drives one route at a time, so it
 *         owns one daemon; two routes on one clone map to one path, and the atomic claim
 *         (setRouteReminderPidHandle) elects one daemon. the `.focus` extension names which route
 *         that daemon nudges about (getRouteReminderFocus)
 *
 * .note = `.crashes` holds the consecutive crash-on-arrival counter (the auto-respawn breaker),
 *         per clone: a broken spawn trips once, not once per route
 *
 * .note = `repoRoot` comes from getRouteReminderRepoRoot, so every caller anchors on one dir. the
 *         path is made absolute here regardless: a detached daemon runs from another cwd, so a
 *         relative handle path would name another file in each process
 */
export const getRouteReminderHandlePath = (input: {
  repoRoot: string;
  cloneAddr: string;
  ext: 'pid' | 'log' | 'crashes' | 'focus';
}): string =>
  path.join(
    path.resolve(input.repoRoot),
    DIR_OF_ROUTE_REMINDER_HANDLES,
    `${asRouteReminderHandleStem({ cloneAddr: input.cloneAddr })}.${input.ext}`,
  );
