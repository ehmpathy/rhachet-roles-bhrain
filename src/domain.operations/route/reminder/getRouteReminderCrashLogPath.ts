import * as path from 'path';

/**
 * .what = the on-disk path of one RouteReminder malfunction crash log, for a given index
 * .why = when the daemon self-exits on a FAILED REACH (the first-fail session-dead door), that exit
 *        is otherwise silent — a human cannot tell a true session-end from a transient-blip
 *        false-positive (vision U3 idle-stall decision, settled 2026-09-06). a durable crash record
 *        under `$route/.malfunctions/` cures that: the exit leaves a discoverable trace. one builder
 *        owns the path shape so the writer and any future reader cannot drift on where it lives.
 *
 * .note = the route is pinned ABSOLUTE (path.resolve against the caller's cwd), the same guard the
 *         pid/log handle builder applies, so every writer keys the crash dir on ONE canonical path
 *         regardless of a relative-vs-absolute `--route`.
 *
 * .note = route-level (NOT per-session): the index — not a session token — disambiguates successive
 *         crashes, so a route's whole crash history sits in one `.malfunctions/` dir across daemon
 *         lifetimes and sessions. the crashing session's cloneAddr is recorded in the file CONTENT,
 *         not the path (the wisher's chosen shape: `daemon.driveon._.crash.n<index>.log`).
 */
export const getRouteReminderCrashLogPath = (input: {
  route: string;
  index: number;
}): string =>
  path.join(
    path.resolve(input.route),
    '.malfunctions',
    `daemon.driveon._.crash.n${input.index}.log`,
  );
