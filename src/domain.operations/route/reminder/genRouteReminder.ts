import { UnexpectedCodePathError } from 'helpful-errors';

import { DEFAULT_REMINDER_INTERVAL_MS } from './DEFAULT_REMINDER_INTERVAL_MS';
import { DEFAULT_REMINDER_SAY_TIMEOUT_MS } from './DEFAULT_REMINDER_SAY_TIMEOUT_MS';
import { delRouteReminderPidHandleIfPid } from './delRouteReminderPidHandleIfPid';
import { getRouteReminder } from './getRouteReminder';
import { isProcessAlive } from './isProcessAlive';
import { RouteReminderOrphanError } from './RouteReminderOrphanError';
import { readRouteReminderRawPid } from './readRouteReminderRawPid';
import { setRouteReminderPidHandle } from './setRouteReminderPidHandle';
import { stopProcess } from './stopProcess';
import {
  DEFAULT_ROUTE_REMINDER_BOOT_SETTLE_MS,
  verifyRouteReminderBootSurvival,
} from './verifyRouteReminderBootSurvival';

/**
 * .what = reap a just-spawned daemon after a fault; if the reap ITSELF faults, escalate to a
 *         RouteReminderOrphanError so a loose daemon is never swallowed as benign.
 * .why = both fault paths — the handle-WRITE catch and the RECONCILE guard — need this exact step:
 *        SIGKILL the orphan, or, when the reap cannot proceed, surface it as un-reapable. one helper
 *        keeps the orphan guarantee AND its message identical at both call sites; `label` names
 *        WHICH step faulted (rule.forbid.failhide — an un-reapable orphan is never a plain Error).
 * .note = returns void on a clean reap (the caller then rethrows the ORIGINAL fault as the true
 *         cause); throws RouteReminderOrphanError only when the reap itself faults.
 */
const reapOrThrowOrphan = (input: {
  pid: number;
  route: string;
  label: 'write' | 'reconcile';
  cause: unknown;
}): void => {
  try {
    stopProcess({ pid: input.pid, signal: 'SIGKILL' });
  } catch (reapError: unknown) {
    throw new RouteReminderOrphanError(
      `RouteReminder handle ${input.label} faulted, and the orphan-reap faulted too — a daemon (pid ${input.pid}) may be orphaned and still alive; kill it manually: kill -9 ${input.pid}`,
      {
        faultCause: input.cause,
        reapError,
        pid: input.pid,
        route: input.route,
      },
    );
  }
};

/**
 * .what = registers a driver session's RouteReminder daemon — an ATOMIC findsert on the handle
 * .why = the route system upserts the reminder as a route goes live. gen (findsert) keeps it
 *        idempotent AND race-safe: if a live daemon already answers for this session, return it;
 *        a concurrent double-register can never leave two daemons, because the pid handle is
 *        claimed by an exclusive-create write — the filesystem elects exactly one winner, and a
 *        loser reaps its extra daemon (rule.forbid.behavior-hazards — no unguarded read-modify-write).
 *
 * .note = named `gen` because it is a findsert (find-or-create) — the sanctioned verb per
 *         rule.require.get-set-gen-verbs (`set` always overwrites; `gen` preserves an extant
 *         live daemon).
 *
 * .note = the op reads as pure composition: getRouteReminder (read) + spawnDaemon (injected host
 *         boundary) + setRouteReminderPidHandle / delRouteReminderPidHandleIfPid / stopProcess
 *         (communicator leaves). no raw fs/process i/o inline (rule.prefer.decomposable-architecture).
 *
 * .note = `spawnDaemon` is the injected host boundary — the OS mechanics of the detached spawn,
 *         substitutable per host (the in-repo `spawnRouteReminderDaemon`, or the enroller's own).
 *         WHEN this findsert runs is in-repo (route.drive, via syncRouteReminderForDrive); this op
 *         owns only the atomic findsert on the handle. the host's REAL implementation MUST spawn the child DETACHED —
 *         `detached: true` + `stdio: 'ignore'` + `.unref()` — so the daemon outlives its parent
 *         process. that detachment IS the vision's "external, self-exit daemon" premise: a plain
 *         child_process.spawn with no detach yields a daemon that dies the moment its parent exits,
 *         which defeats the whole mechanism. the in-repo host `spawnRouteReminderDaemon` honors it,
 *         and its unit test asserts every detachment flag.
 */
export const genRouteReminder = async (
  input: {
    route: string;
    cloneAddr: string;
    intervalMs: number | null;
    sayTimeoutMs: number | null;
  },
  context: {
    spawnDaemon: (input: {
      route: string;
      cloneAddr: string;
      intervalMs: number;
      sayTimeoutMs: number;
    }) => Promise<{ pid: number }>;
  },
): Promise<{ pid: number; created: boolean; alive: boolean }> => {
  // fast path — a live daemon already answers for this session → return it, spawn none. it was live
  // when getRouteReminder read it (a dead/stale handle reads as absent), so it reports alive.
  const reminderFound = await getRouteReminder({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });
  if (reminderFound)
    return { pid: reminderFound.pid, created: false, alive: true };

  // spawn a fresh daemon via the injected host boundary
  const intervalMs = input.intervalMs ?? DEFAULT_REMINDER_INTERVAL_MS;
  const sayTimeoutMs = input.sayTimeoutMs ?? DEFAULT_REMINDER_SAY_TIMEOUT_MS;
  const { pid } = await context.spawnDaemon({
    route: input.route,
    cloneAddr: input.cloneAddr,
    intervalMs,
    sayTimeoutMs,
  });

  // atomically claim the handle for the freshly spawned pid; the reconcile handles any
  // concurrent winner or stale handle. on any fault, the just-spawned daemon is reaped so no
  // orphan lingers.
  const claimed = await claimHandleForSpawnedPid({
    route: input.route,
    cloneAddr: input.cloneAddr,
    pid,
    triesLeft: 2,
  });

  // a CONCURRENT winner claimed the slot first → its daemon was live at claim time; report alive.
  if (!claimed.created) return { ...claimed, alive: true };

  // OWN the findsert postcondition: a FRESH spawn that does not SURVIVE its boot crashed on arrival
  // (a broken host, a bad node binary, an OOM mid-boot). verify boot-SURVIVAL — alive across a short
  // settle window, NOT merely alive microseconds after fork — because a crash-on-arrival child is
  // still amid its dynamic import at an instantaneous probe and dies a moment later; an instantaneous
  // `kill -0` would report it alive, write a handle that goes stale in ms, and the next hook would
  // re-spawn → a silent, unbounded spawn-storm (rule.forbid.behavior-hazards). the survival check +
  // dead-handle reconcile is the findsert's OWN invariant, domain logic that must not leak into a
  // CLI/drive caller (rule.require.directional-deps, rule.prefer.decomposable-architecture). callers
  // keep only their OWN surface (log vs stdout) and their OWN activity gate (a not-active route's
  // daemon self-exits by design — a separate concern).
  const { survived: alive } = await verifyRouteReminderBootSurvival({
    pid: claimed.pid,
    settleMs: DEFAULT_ROUTE_REMINDER_BOOT_SETTLE_MS,
  });
  if (!alive)
    await delRouteReminderPidHandleIfPid({
      route: input.route,
      cloneAddr: input.cloneAddr,
      pid: claimed.pid,
    });
  return { pid: claimed.pid, created: true, alive };
};

/**
 * .what = the atomic-claim + reconcile step, after a daemon has been spawned
 * .why = the exclusive-create write is the race guard, but two cases still need reconcile:
 *        a CONCURRENT winner (another register claimed the slot first → reap ours, return theirs)
 *        and a STALE handle (a dead pid's file survives → remove it, retry the claim once). the
 *        reconcile is bounded + recursive so it stays const-only and cannot loop forever
 *        (rule.require.immutable-vars).
 */
const claimHandleForSpawnedPid = async (input: {
  route: string;
  cloneAddr: string;
  pid: number;
  triesLeft: number;
}): Promise<{ pid: number; created: boolean }> => {
  const { claimed } = await setRouteReminderPidHandle({
    route: input.route,
    cloneAddr: input.cloneAddr,
    pid: input.pid,
  }).catch((writeError: unknown) => {
    // a write fault (permission, i/o) leaves the daemon orphaned → reap it (or surface an
    // un-reapable orphan). a clean reap means the write fault is the true cause → rethrow it unwrapped.
    reapOrThrowOrphan({
      pid: input.pid,
      route: input.route,
      label: 'write',
      cause: writeError,
    });
    throw writeError;
  });

  // we claimed the slot → this register created the live daemon
  if (claimed) return { pid: input.pid, created: true };

  // a handle already existed → reconcile the race. ANY fault in the reconcile (a torn handle from
  // readRouteReminderRawPid, an EPERM liveness probe, an EPERM reap) MUST reap the just-spawned pid
  // before it propagates — else the daemon is left loose with no handle on disk, a nudge drone
  // unaddressable by get/del (rule.forbid.behavior-hazards). reapSpawnedPidOnFault guarantees that,
  // and turns a reap that ITSELF faults into a RouteReminderOrphanError so the auto-wire guard never
  // swallows a loose daemon as benign (rule.forbid.failhide).
  return reapSpawnedPidOnFault(input, () => reconcileExtantHandle(input));
};

/**
 * .what = the EEXIST reconcile after a lost claim — read the extant holder, settle the race
 * .why = a lost claim means another writer holds the handle, OR a stale handle survives a crash.
 *        three outcomes: a CONCURRENT winner (a live holder → reap ours, return theirs), a
 *        VANISHED handle (a concurrent remove → retry), and a STALE handle (a dead pid's file →
 *        compare-and-delete keyed on that pid, then retry). kept separate from its reap-guard so
 *        the guard (reapSpawnedPidOnFault) can wrap the WHOLE sequence — every throw in here reaps
 *        the just-spawned pid before it escapes.
 *
 * .note = this reads / probes / reaps and may THROW (a torn handle, an EPERM probe, an EPERM reap).
 *         it does NOT reap input.pid on those throws itself — its caller wraps it in
 *         reapSpawnedPidOnFault, which owns the reap-on-fault guarantee for the whole reconcile.
 */
const reconcileExtantHandle = async (input: {
  route: string;
  cloneAddr: string;
  pid: number;
  triesLeft: number;
}): Promise<{ pid: number; created: boolean }> => {
  // a handle already existed. read the pid it NAMES (not its liveness) so we can reconcile safely.
  const holder = await readRouteReminderRawPid({
    route: input.route,
    cloneAddr: input.cloneAddr,
  });

  // the handle vanished between our claim and this read (a concurrent remove) → retry the claim.
  if (holder === null) return retryClaim(input);

  // a LIVE holder = a concurrent register won → reap our extra daemon, return the winner's pid.
  // if this SIGKILL faults (EPERM — the daemon is alive but not ours), the throw escapes to the
  // reapSpawnedPidOnFault guard, which re-reaps and, if that also faults, surfaces the loose
  // daemon as a RouteReminderOrphanError (never a benign plain Error).
  if (isProcessAlive({ pid: holder.pid })) {
    stopProcess({ pid: input.pid, signal: 'SIGKILL' });
    return { pid: holder.pid, created: false };
  }

  // a DEAD holder = the extant handle is STALE. remove it with a compare-and-delete keyed on the
  // stale pid we just read, so a fresh handle raced-in by a concurrent register (a DIFFERENT pid)
  // is left intact — never orphaned — then retry the claim (rule.forbid.behavior-hazards).
  await delRouteReminderPidHandleIfPid({
    route: input.route,
    cloneAddr: input.cloneAddr,
    pid: holder.pid,
  });
  return retryClaim(input);
};

/**
 * .what = runs a reconcile body, guaranteeing the just-spawned daemon is reaped on ANY fault
 * .why = the post-claim reconcile reads a handle, probes liveness, reaps, and retries — every one
 *        of those can throw (a torn handle → UnexpectedCodePathError, an EPERM probe / reap). a
 *        throw that escaped WITHOUT reaping input.pid would leave the just-spawned daemon loose with
 *        no handle on disk — a nudge drone unaddressable by get/del, nudging forever
 *        (rule.forbid.behavior-hazards). this guard reaps input.pid on every fault path before it
 *        propagates, so the reconcile keeps the same all-or-none contract as the write-fault catch
 *        above.
 *
 * .note = a reap that ITSELF faults is the one un-proceedable orphan → RouteReminderOrphanError,
 *         so stepRouteDrive's fault-guard (which keys ONLY on that subtype) never swallows a loose
 *         daemon as benign (rule.forbid.failhide). a fault that is ALREADY a RouteReminderOrphanError
 *         (thrown by a nested claim) propagates unwrapped — its daemon is the same input.pid, so a
 *         re-reap is a harmless ESRCH no-op, and re-wrapping would only bury the original cause.
 */
const reapSpawnedPidOnFault = async (
  input: { route: string; pid: number },
  body: () => Promise<{ pid: number; created: boolean }>,
): Promise<{ pid: number; created: boolean }> =>
  body().catch((faultError: unknown) => {
    // an orphan is already the un-proceedable class → propagate as-is (its pid is already reaped)
    if (faultError instanceof RouteReminderOrphanError) throw faultError;

    // reap the just-spawned daemon so no loose nudge drone survives the fault (or surface an
    // un-reapable orphan). a clean reap means the reconcile fault is the true cause → rethrow it.
    reapOrThrowOrphan({
      pid: input.pid,
      route: input.route,
      label: 'reconcile',
      cause: faultError,
    });
    throw faultError;
  });

/**
 * .what = the bounded recurse of the claim reconcile — one more try, or fail loud
 * .why = a pathological repeat (a handle that returns each pass) must not spin forever; exhaustion
 *        reaps our daemon and throws so a human sees the non-convergence (rule.require.failfast).
 *
 * .note = a non-converged claim is an INTERNAL INVARIANT violation, so it throws an
 *         UnexpectedCodePathError (the internal-invariant class this codebase carries; the
 *         mechanic's MalfunctionError is not exported by this helpful-errors version) with
 *         route + cloneAddr + pid, so a maintainer sees WHICH session failed (rule.require.failloud).
 *         it is NOT a RouteReminderOrphanError: the daemon is reaped BEFORE the throw, so no process
 *         is left loose — the auto-wire's fault-guard surfaces this loud + proceeds, and only a
 *         RouteReminderOrphanError propagates.
 */
const retryClaim = (input: {
  route: string;
  cloneAddr: string;
  pid: number;
  triesLeft: number;
}): Promise<{ pid: number; created: boolean }> => {
  if (input.triesLeft <= 0) {
    stopProcess({ pid: input.pid, signal: 'SIGKILL' });
    throw new UnexpectedCodePathError(
      'RouteReminder handle claim did not converge; the just-spawned daemon was reaped, so none is orphaned',
      { route: input.route, cloneAddr: input.cloneAddr, pid: input.pid },
    );
  }
  return claimHandleForSpawnedPid({
    route: input.route,
    cloneAddr: input.cloneAddr,
    pid: input.pid,
    triesLeft: input.triesLeft - 1,
  });
};
