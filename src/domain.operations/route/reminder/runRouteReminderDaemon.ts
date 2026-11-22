import { asNodeErrnoCode } from '../asNodeErrnoCode';
import { delRouteReminderPidHandleIfPid } from './delRouteReminderPidHandleIfPid';
import {
  DEFAULT_REMINDER_JITTER_RATIO,
  getRouteReminderJitteredMs,
} from './getRouteReminderJitteredMs';
import { isRouteReminderHandleOwnedBy } from './isRouteReminderHandleOwnedBy';
import { setRouteReminderCrashLog } from './setRouteReminderCrashLog';
import type { RouteReminderExitReason } from './stepRouteReminderTick';
import { stepRouteReminderTick } from './stepRouteReminderTick';
import { withToleratedIoFaultAsValue } from './withToleratedIoFaultAsValue';

/**
 * .what = the doors a daemon can exit through: each tick door, plus a lost handle
 * .why = a tick judges the focus; the loop alone judges whether it still holds the clone's slot
 */
export type RouteReminderDaemonExitReason =
  | RouteReminderExitReason
  | 'handle-lost';

/**
 * .what = the RouteReminder daemon loop — tick, sleep, repeat, until a tick says exit
 * .why = a wall-clock loop that wakes every interval, runs one tick, and tears itself down the moment
 *        a tick returns `exit`. the loop cannot outlive its purpose, because every cycle re-reads the
 *        focus and the exit decision from disk.
 *
 * .note = one loop per clone. it carries no route of its own: each tick reads the clone's focus, so
 *         the loop follows the clone from route to route with no respawn.
 *
 * .note = the loop owns its handle. after each sleep it checks that the clone's handle still names
 *         its pid, and exits `handle-lost` once it does not, so a wiped or reclaimed slot never
 *         leaves an orphan to nudge beside a fresh daemon. the check waits for the first sleep: at
 *         tick 1 the spawn parent may not have claimed the slot yet. on any exit, a throw included,
 *         it drops the handle if the handle still names its pid
 *
 * .note = `stepRouteReminderTick` is a same-repo domain op, so it is IMPORTED, never injected
 *         (rule.forbid.inject-same-repo-domain-ops). only the genuine external boundaries are
 *         injected: `sayToClone`, `sleep`, and `random` (the jitter source).
 *
 * .note = each sleep is JITTERED ±10% (getRouteReminderJitteredMs) so a fleet of daemons that
 *         register together does not tick in lockstep.
 */
export const runRouteReminderDaemon = async (
  input: {
    repoRoot: string;
    cloneAddr: string;
    pid: number;
    intervalMs: number;
    sayTimeoutMs: number;
  },
  context: {
    sayToClone: (input: {
      addr: string;
      what: string;
      timeoutMs?: number;
    }) => Promise<{ reached: true } | { reached: false; reason: string }>;
    sleep: (ms: number) => Promise<void>;
    random?: () => number;
  },
): Promise<{
  exitReason: RouteReminderDaemonExitReason;
  route: string | null;
  ticks: number;
}> => {
  try {
    return await runLoop(input, context);
  } finally {
    // drop the handle while it still names this pid, so a stale pid file never outlives its daemon
    // to be read live once the pid is recycled. a tolerated io fault is surfaced and the exit stays
    // as it was; any other fault rethrows (rule.forbid.failhide)
    const handleFault = await withToleratedIoFaultAsValue(() =>
      delRouteReminderPidHandleIfPid({
        repoRoot: input.repoRoot,
        cloneAddr: input.cloneAddr,
        pid: input.pid,
      }),
    );
    if (handleFault)
      // eslint-disable-next-line no-console
      console.error(
        `route.reminder.daemon could not drop its own handle (${asNodeErrnoCode(handleFault)}); the next gen reconciles it: clone=${input.cloneAddr}`,
        handleFault,
      );
  }
};

/**
 * .what = the loop body: tick, then sleep, then confirm the slot, until a door opens
 * .why = kept apart from the handle drop, so the drop wraps every way out of the loop
 */
const runLoop = async (
  input: Parameters<typeof runRouteReminderDaemon>[0],
  context: Parameters<typeof runRouteReminderDaemon>[1],
): Promise<{
  exitReason: RouteReminderDaemonExitReason;
  route: string | null;
  ticks: number;
}> => {
  // deliberate mutation: a loop counter is the one scoped mutable in this daemon loop
  // (rule.require.immutable-vars scoped-mutation exemption).
  let ticks = 0;

  // wake each interval; a tick either nudges (loop on) or exits (loop ends)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const outcome = await stepRouteReminderTick(
      {
        repoRoot: input.repoRoot,
        cloneAddr: input.cloneAddr,
        sayTimeoutMs: input.sayTimeoutMs,
      },
      { sayToClone: context.sayToClone },
    );
    ticks += 1;

    // a dead route or dead session ends the loop — the daemon tears itself down
    if (outcome.action === 'exit') {
      // a failed reach (session-dead) is the ONE exit that must be OBSERVABLE: record a durable
      // crash log under the focus route, so a transient-blip false-positive leaves a trace. the
      // route-end doors are clean exits — no crash log there. an EXPECTED io fault on that aux write
      // is surfaced to stderr and the exit stays clean; any other fault rethrows
      // (rule.forbid.failhide)
      const crashRoute =
        outcome.reason === 'session-dead' ? outcome.route : null;
      const crashLogFault = crashRoute
        ? await withToleratedIoFaultAsValue(() =>
            setRouteReminderCrashLog({
              route: crashRoute,
              cloneAddr: input.cloneAddr,
              reason: outcome.reason,
              ticks,
            }),
          )
        : null;
      if (crashLogFault)
        // eslint-disable-next-line no-console
        console.error(
          `route.reminder.daemon crash-log write failed (${asNodeErrnoCode(crashLogFault)}; exit still clean): reason=${outcome.reason} route=${crashRoute} clone=${input.cloneAddr}`,
          crashLogFault,
        );
      return { exitReason: outcome.reason, route: outcome.route, ticks };
    }

    // the nudge landed; sleep a jittered interval, then wake for the next tick
    await context.sleep(
      getRouteReminderJitteredMs({
        intervalMs: input.intervalMs,
        ratio: DEFAULT_REMINDER_JITTER_RATIO,
        random: context.random ?? Math.random,
      }),
    );

    // the slot is the clone's one; once it no longer names this pid, another daemon may hold it
    const isHandleOwn = await isRouteReminderHandleOwnedBy({
      repoRoot: input.repoRoot,
      cloneAddr: input.cloneAddr,
      pid: input.pid,
    });
    if (!isHandleOwn)
      return { exitReason: 'handle-lost', route: outcome.route, ticks };
  }
};
