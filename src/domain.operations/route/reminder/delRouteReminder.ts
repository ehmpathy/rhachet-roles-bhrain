import { delRouteReminderCrashBreaker } from './delRouteReminderCrashBreaker';
import { delRouteReminderLog } from './delRouteReminderLog';
import { delRouteReminderPidHandleIfPid } from './delRouteReminderPidHandleIfPid';
import { getRouteReminder } from './getRouteReminder';
import { stopProcess } from './stopProcess';

/**
 * .what = deregisters a driver session's RouteReminder — stops the daemon and clears its handle
 * .why = the daemon normally self-exits (reads a dead route/session and dies), but a human or
 *        the route system may want to tear it down on demand. this is the explicit teardown:
 *        signal the live pid, then remove the pid file — but ONLY the handle that still names
 *        that exact pid (compare-and-delete). idempotent — a re-run on an already-absent reminder
 *        is a no-op, so a retry never errors.
 *
 * .note = the handle removal is a COMPARE-AND-DELETE, not an unconditional rm. an unconditional
 *         rm has a race: between the getRouteReminder read and the removal, a concurrent
 *         genRouteReminder for THIS session can claim a fresh handle (a new daemon, new pid); an
 *         unconditional rm would delete THAT new handle and orphan a live daemon that keeps its
 *         nudge cadence and can never be reaped (rule.forbid.behavior-hazards). so the handle is
 *         removed only when it still names the pid we stopped — delRouteReminderPidHandleIfPid.
 *
 * .note = a stale/absent handle (getRouteReminder → null) is left UNTOUCHED. a stale pid file is
 *         an inert dead pointer that never wakes (the next register's reconcile overwrites it),
 *         so an unconditional rm here would earn no cleanup yet reopen the same race against a
 *         concurrent register. leave the inert file; the register owns stale reconcile.
 *
 * .note = the op reads as pure composition: getRouteReminder (read) + stopProcess +
 *         delRouteReminderPidHandleIfPid (communicator leaves) — no raw process/fs i/o inline
 *         (rule.prefer.decomposable-architecture). the ESRCH / ENOENT allowlists live in those
 *         leaves, one home each (rule.forbid.failhide).
 *
 * .note = per-session scope: keyed by route AND cloneAddr, so it tears down THIS session's
 *         reminder only, never another session's on the same route (vision Q10 / wish).
 *
 * .note = a deliberate teardown that OWNS the handle removal also clears the per-session log and
 *         crash-breaker. the log persists past a self-exit / crash by design (so `get` can read a
 *         death), but an operator who deliberately deregisters did NOT crash it — a leftover log
 *         would make `get` misreport the intentional stop as "gone quiet (self-exited or crashed)".
 *         so a deliberate teardown leaves a clean slate: `get` after `del` reads "not registered",
 *         the accurate state (rule.require.errors-name-the-fix). the wipe is GATED on the
 *         compare-and-delete outcome (`removed === true`): a stale/absent handle (the early no-op
 *         return) OR a CHANGED handle (a concurrent gen claimed a fresh one → `removed:false`)
 *         leaves the log + crash-breaker UNTOUCHED — a genuine self-exit keeps its log for
 *         post-mortem, and a raced-in live daemon keeps its own trail (never wiped out from under it).
 *
 * returns whether a live daemon was stopped (`stopped`), for a legible status report.
 * `stopped:false` collapses two states — no reminder was ever set, AND a stale handle whose
 * daemon had already died — because `getRouteReminder` reads both as "not live" by design
 * (a dead pointer is indistinguishable from absence at the detect boundary). teardown treats
 * them identically (no live pid to signal), so the collapse costs the caller no decision.
 */
export const delRouteReminder = async (input: {
  route: string;
  cloneAddr: string;
}): Promise<{ stopped: boolean }> => {
  const reminder = await getRouteReminder({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });

  // no live daemon (absent or stale handle) → no-op. leave any inert stale handle for the
  // register's reconcile; do NOT unconditionally rm it (that reopens the concurrent-register race).
  if (!reminder) return { stopped: false };

  // signal the live daemon to stop (SIGTERM); a gone pid is a benign no-op (stopProcess → false)
  const { stopped } = stopProcess({ pid: reminder.pid, signal: 'SIGTERM' });

  // compare-and-delete: remove the handle ONLY if it still names the pid we just stopped, so a
  // concurrent register's fresh handle is never deleted (never orphans that new daemon).
  const { removed } = await delRouteReminderPidHandleIfPid({
    route: input.route,
    cloneAddr: input.cloneAddr,
    pid: reminder.pid,
  });

  // clear the log + crash-breaker ONLY when THIS teardown owned the removal (removed === true). a
  // deliberate teardown is not a death, so `get` must read the accurate "not registered", never a
  // misattributed "gone quiet". BUT if the compare-and-delete found the handle had CHANGED
  // (removed === false → a concurrent gen claimed a fresh handle for a NEW live daemon), the log +
  // crash-breaker belong to THAT live daemon — a wipe would erase a live process's diagnostic trail,
  // the exact "a stale/changed handle leaves the log untouched" invariant this module documents
  // (rule.forbid.behavior-hazards). both removes are idempotent (ENOENT allowlisted in the leaves).
  if (removed) {
    await delRouteReminderLog({
      route: input.route,
      cloneAddr: input.cloneAddr,
    });
    await delRouteReminderCrashBreaker({
      route: input.route,
      cloneAddr: input.cloneAddr,
    });
  }

  return { stopped };
};
