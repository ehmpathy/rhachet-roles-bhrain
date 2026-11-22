import { readRouteReminderRawPid } from './readRouteReminderRawPid';

/**
 * .what = whether a clone's handle names this pid
 * .why = the handle is the clone's one slot. a daemon whose pid the handle no longer names is an
 *        orphan: a fresh spawn can claim the slot beside it, and both would nudge. so the daemon
 *        asks this each cycle, and exits once the answer is no
 *
 * .note = an absent handle reads as not owned: a wiped `.agent/.cache` leaves the slot free for a
 *         spawn, so the daemon that held it must yield. a torn handle throws (the strict parse)
 */
export const isRouteReminderHandleOwnedBy = async (input: {
  repoRoot: string;
  cloneAddr: string;
  pid: number;
}): Promise<boolean> => {
  const named = await readRouteReminderRawPid({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });
  return named?.pid === input.pid;
};
