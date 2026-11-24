import { delRouteReminderCrashBreaker } from './delRouteReminderCrashBreaker';
import { delRouteReminderLog } from './delRouteReminderLog';
import { delRouteReminderPidHandleIfPid } from './delRouteReminderPidHandleIfPid';
import { delRouteReminderTornHandle } from './delRouteReminderTornHandle';
import { getRouteReminder } from './getRouteReminder';
import { stopProcess } from './stopProcess';

/**
 * .what = deregisters a clone's RouteReminder — stops the daemon and clears its handle
 * .why = the daemon normally self-exits (reads a dead focus route or a dead session and dies), but a
 *        human or the route system may want to tear it down on demand. this is the explicit teardown:
 *        signal the live pid, then remove the pid file — but ONLY the handle that still names that
 *        exact pid (compare-and-delete). idempotent — a re-run on an absent reminder is a no-op
 *
 * .note = it tears down the clone handle alone. the legacy per-route sweep
 *         (delRouteReminderLegacyHandles) runs from two callers only: genRouteReminder before a spawn,
 *         and the `route.reminder.del` cli. a drive that reaps on every hook never pays for the sweep
 *
 * .note = the handle removal is a COMPARE-AND-DELETE, not an unconditional rm: a concurrent
 *         genRouteReminder can claim a fresh handle between the read and the removal, and an
 *         unconditional rm would orphan that new daemon (rule.forbid.behavior-hazards)
 *
 * .note = a stale/absent handle (getRouteReminder → null) is left UNTOUCHED; the register owns stale
 *         reconcile, so an rm here would earn no cleanup yet reopen the race
 *
 * .note = the FOCUS is kept. it names the route the clone drove last, so `route.reminder.get` after a
 *         reap can name that route and why it halted — never a false "never registered"
 *
 * .note = a teardown that OWNS the handle removal also clears the clone log and crash-breaker, so
 *         `get` after `del` reads the accurate state. the wipe is GATED on `removed === true`: a
 *         changed handle (a concurrent gen claimed a fresh one) belongs to a live daemon, whose trail
 *         must survive
 *
 * .note = a TORN handle (a body that is no pid) is cleared first: every strict read throws on it, so
 *         without this the teardown would die on the one state it exists to clear
 *
 * returns whether a live daemon was stopped (`stopped`), and the torn handle it cleared, if any
 * (`torn`). `stopped:false` collapses "never set" and "stale handle", which getRouteReminder reads
 * alike; teardown treats them alike too.
 */
export const delRouteReminder = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<{
  stopped: boolean;
  torn: { pidPath: string; raw: string } | null;
}> => {
  // a torn handle names no daemon to stop; clear it, so the slot reads empty
  const torn = await delRouteReminderTornHandle({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });
  if (torn) return { stopped: false, torn };

  const reminder = await getRouteReminder({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });

  // no live daemon (absent or stale handle) → no-op; the register reconciles a stale handle
  if (!reminder) return { stopped: false, torn: null };

  // signal the live daemon to stop (SIGTERM); a gone pid is a benign no-op (stopProcess → false)
  const { stopped } = stopProcess({ pid: reminder.pid, signal: 'SIGTERM' });

  // compare-and-delete: remove the handle ONLY if it still names the pid we just stopped
  const { removed } = await delRouteReminderPidHandleIfPid({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
    pid: reminder.pid,
  });

  // clear the log + crash-breaker ONLY when THIS teardown owned the removal; a changed handle's
  // trail belongs to the live daemon that claimed it
  if (removed) {
    await delRouteReminderLog({
      repoRoot: input.repoRoot,
      cloneAddr: input.cloneAddr,
    });
    await delRouteReminderCrashBreaker({
      repoRoot: input.repoRoot,
      cloneAddr: input.cloneAddr,
    });
  }

  return { stopped, torn: null };
};
