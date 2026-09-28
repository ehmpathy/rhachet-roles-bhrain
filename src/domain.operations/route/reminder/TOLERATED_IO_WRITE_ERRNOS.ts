/**
 * .what = the fs errnos an AUXILIARY-observability write may legitimately fault with — the expected
 *         io/permission class, allowlisted as "tolerate, surface, do not treat as a bug".
 * .why = both the daemon's `.malfunctions/` crash-log write (runRouteReminderDaemon) and the drive
 *        hook's per-session reminder-log write (surfaceRouteReminderFault) target the host fs, so the
 *        expected fault class is identical: no space, read-only mount, denied dir, a vanished parent,
 *        over quota, or a path component that is a file not a dir (ENOTDIR). a fault OUTSIDE this set
 *        (or a non-errno throw, e.g. a TypeError from a bug in the writer) is NOT an expected io fault
 *        — each caller surfaces it distinctly (a rethrow in the disposable daemon, a loud UNEXPECTED
 *        line in the drive hook that must not throw), never laundered as routine (rule.forbid.failhide).
 *        one shared list keeps the two writers in agreement on which errnos count as tolerable.
 */
export const TOLERATED_IO_WRITE_ERRNOS = [
  'EACCES',
  'EPERM',
  'ENOSPC',
  'EROFS',
  'ENOENT',
  'ENOTDIR',
  'EDQUOT',
];
