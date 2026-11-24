import { readRouteReminderRawPidAt } from './readRouteReminderRawPidAt';

/**
 * .what = reads the pid a RouteReminder pid file names, with a read fault returned as a value
 * .why = the legacy sweep keeps a handle on an expected read fault and moves on, so it needs the
 *        fault in hand rather than thrown. one named read keeps that capture out of the sweep's
 *        narrative; the caller still decides which faults are expected (rule.forbid.failhide)
 *
 * returns `{ named }` (null when the file is absent), or `{ fault }` when the read threw.
 */
export const readRouteReminderRawPidAtOrFault = async (input: {
  pidPath: string;
}): Promise<{ named: { pid: number } | null } | { fault: unknown }> =>
  readRouteReminderRawPidAt({ pidPath: input.pidPath }).then(
    (named) => ({ named }),
    (fault: unknown) => ({ fault }),
  );
