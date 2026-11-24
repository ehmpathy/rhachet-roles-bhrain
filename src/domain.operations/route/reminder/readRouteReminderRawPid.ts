import { getRouteReminderPidPath } from './getRouteReminderPidPath';
import { readRouteReminderRawPidAt } from './readRouteReminderRawPidAt';

/**
 * .what = reads the pid a clone's handle NAMES, with no liveness probe — parse only
 * .why = two callers need the raw pid on the handle, not the "is it live" verdict: `getRouteReminder`
 *        (which then probes liveness) and the register reconcile (which compare-and-deletes a STALE
 *        handle keyed on the pid it named). the strict gate lives in readRouteReminderRawPidAt
 *
 * returns the named pid, or null when the handle is absent. a malformed handle throws.
 */
export const readRouteReminderRawPid = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<{ pid: number } | null> =>
  readRouteReminderRawPidAt({
    pidPath: getRouteReminderPidPath({
      repoRoot: input.repoRoot,
      cloneAddr: input.cloneAddr,
    }),
  });
