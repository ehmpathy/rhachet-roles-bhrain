import { delRouteReminderPidHandleIfPidAt } from './delRouteReminderPidHandleIfPidAt';
import { getRouteReminderPidPath } from './getRouteReminderPidPath';

/**
 * .what = removes a clone's pid handle ONLY if it still names `pid` — a compare-and-delete
 * .why = teardown must never delete a handle a concurrent register claimed for a NEW daemon; the
 *        compare-and-delete lives in delRouteReminderPidHandleIfPidAt, and this names the clone path
 *
 * returns whether the handle was removed (`removed:true`) or left because it no longer named `pid`.
 */
export const delRouteReminderPidHandleIfPid = async (input: {
  repoRoot: string;
  cloneAddr: string;
  pid: number;
}): Promise<{ removed: boolean }> =>
  delRouteReminderPidHandleIfPidAt({
    pidPath: getRouteReminderPidPath({
      repoRoot: input.repoRoot,
      cloneAddr: input.cloneAddr,
    }),
    pid: input.pid,
  });
