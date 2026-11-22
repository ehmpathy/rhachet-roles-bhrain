import { HelpfulError } from 'helpful-errors';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import type { RouteDriveFrontier } from '../stones/getRouteDriveFrontier';
import { bumpRouteReminderCrashBreaker } from './bumpRouteReminderCrashBreaker';
import { delRouteReminder } from './delRouteReminder';
import { delRouteReminderCrashBreaker } from './delRouteReminderCrashBreaker';
import { genRouteReminder } from './genRouteReminder';
import { getRouteDriverCloneAddr } from './getRouteDriverCloneAddr';
import { getRouteReminderCrashBreaker } from './getRouteReminderCrashBreaker';
import { getRouteReminderDriveActivity } from './getRouteReminderDriveActivity';
import { getRouteReminderFocus } from './getRouteReminderFocus';
import { getRouteReminderRepoRoot } from './getRouteReminderRepoRoot';
import { isRouteReminderFocusOn } from './isRouteReminderFocusOn';
import { MAX_ROUTE_REMINDER_CRASHES } from './MAX_ROUTE_REMINDER_CRASHES';
import { setRouteReminderFocus } from './setRouteReminderFocus';
import { surfaceRouteReminderFault } from './surfaceRouteReminderFault';
import { withToleratedIoFaultAsValue } from './withToleratedIoFaultAsValue';

/**
 * .what = reconciles a clone's RouteReminder against the route it drives now, on every drive
 * .why = route.drive runs as an onBoot/onStop hook INSIDE the driver clone, continuously while a
 *        route is inflight, so it is the natural pulse: each drive points the clone's one reminder
 *        at this route (the focus), then findserts the daemon when the route is a live drive, and
 *        reaps it when the route is dead. no human runs `route.reminder.gen` by hand
 *
 * .why one per clone = the handle is keyed on the clone alone. a clone that drives route A, then
 *        route B, keeps ONE daemon: the second drive moves the focus to B and the findsert returns
 *        the live daemon. the daemon reads the focus each tick, so its next nudge is about B
 *
 * .why idempotent = both arms are safe to repeat every drive: the focus write is a set that writes
 *        only on change, genRouteReminder is a findsert, and delRouteReminder is a no-op on an absent
 *        reminder. a re-run on EVERY drive converges, never accretes
 *
 * .why the addr gate = a reminder needs the driver's OWN clone address so the daemon's
 *        `rhx clone say @:<addr>` targets THIS session. a plain (non-enrolled) session has none, so
 *        there is no session to nudge → skip (rule.forbid.failhide — absence is a skip, not a fault)
 *
 * .note focus write fault = the focus is the seam from drive to daemon. if it cannot be written, a
 *         live daemon would keep its old focus and nudge about a route the clone left. so a tolerated
 *         io fault on that write reaps the daemon and surfaces the fault: silence is the safe side,
 *         and the next drive that can write the focus registers afresh. a fault outside the io class
 *         rethrows, so stepRouteDrive's guard surfaces it as the defect it is
 *
 * .note = the active-drive read is getRouteReminderDriveActivity — the SAME composite the daemon's
 *         own tick reads for its focus, so auto-stop here and the daemon's self-exit cannot disagree
 *
 * .note circuit breaker = a persisted per-clone crash-on-arrival counter trips a cutoff
 *         (MAX_ROUTE_REMINDER_CRASHES): once EXCEEDED, this halts the respawn and surfaces the trip
 *         until a human re-arms with a manual route.reminder.gen. a healthy daemon resets the counter
 *
 * .note = the optional pre-read `frontier` and `latest` let stepRouteDrive hand down its one snapshot
 *         of the stone frontier and the passage tail, so the activity read reuses them
 *
 * .note = `spawnDaemon` is the injected host boundary; a test drives this with a fake spawn
 *         (rule.require.dependency-injection)
 */
export const syncRouteReminderForDrive = async (
  input: {
    route: string;
    frontier?: RouteDriveFrontier;
    latest?: PassageReport | null;
  },
  context: {
    spawnDaemon: (input: {
      repoRoot: string;
      cloneAddr: string;
      intervalMs: number;
      sayTimeoutMs: number;
    }) => Promise<{ pid: number }>;
    // the stderr floor a surfaced fault falls to when the clone log cannot hold it; a test injects
    // a collector here, never a spy on the console global
    stderr?: (line: string) => void;
  },
): Promise<{
  synced: 'registered' | 'deregistered' | 'skipped' | 'circuit-broken';
}> => {
  // a reminder needs the driver's own clone address; a plain session (no enroller) has none → skip
  const driver = getRouteDriverCloneAddr();
  if (!driver) return { synced: 'skipped' };
  const floor = { stderr: context.stderr ?? console.error };
  const clone = {
    repoRoot: await getRouteReminderRepoRoot({ from: input.route }),
    cloneAddr: driver.cloneAddr,
  };

  // point the clone's one reminder at the route it drives now. on a tolerated io fault, reap the
  // daemon so it never nudges about a route the clone left, and surface the fault
  const focusFault = await withToleratedIoFaultAsValue(() =>
    setRouteReminderFocus({ ...clone, route: input.route }),
  );
  if (focusFault) {
    // reap first: a reap that owns the handle clears the clone log, so a fault surfaced before it
    // would be wiped. the same fs fault can stop the reap itself (the handle dir unreadable); a
    // daemon there cannot read its focus either, so it faults out on its next tick. a tolerated
    // io fault on the reap is surfaced; any other fault rethrows (rule.forbid.failhide)
    //
    // .residual = this arm reaps with no focus gate. the old focus names the route this clone drove
    //   before, which is the route a live daemon would nudge about once the clone left it — the very
    //   case this arm ends. a concurrent drive of that same route by this clone loses its daemon here,
    //   and its next drive re-registers it (the findsert is idempotent), so silence lasts one hook
    const reapFault = await withToleratedIoFaultAsValue(() =>
      delRouteReminder(clone),
    );
    if (reapFault)
      await surfaceRouteReminderFault(
        { from: input.route, error: reapFault },
        floor,
      );

    // then surface the focus fault, into the log the reap left
    await surfaceRouteReminderFault(
      {
        from: input.route,
        error: new HelpfulError(
          `RouteReminder focus write faulted — the daemon is reaped so it cannot nudge about a route this clone left: ${focusFault.message}`,
          { cause: focusFault },
        ),
      },
      floor,
    );
    return { synced: 'deregistered' };
  }

  // read whether the route is an active self-advanceable drive — the SAME composite the daemon's
  // tick reads for its focus, so the two can never disagree on "is the route still a live drive"
  const activity = await getRouteReminderDriveActivity({
    route: input.route,
    frontier: input.frontier,
    latest: input.latest,
  });

  // a dead drive (blocked / rewound / exhausted / malfunction) OR a COMPLETED drive → reap the
  // reminder (no-op if absent). the focus stays, so `get` names this route and why it halted.
  // the reap is gated on the focus: a concurrent drive of a live route may have moved the focus and
  // claimed the daemon since this drive wrote it, and that daemon is not this route's to reap
  if (!activity.active) {
    const isFocusStillHere = await isRouteReminderFocusOn({
      ...clone,
      route: input.route,
    });
    if (isFocusStillHere) await delRouteReminder(clone);
    return { synced: 'deregistered' };
  }

  // CIRCUIT BREAKER: a SYSTEMATICALLY-broken spawn crashes on arrival and would re-spawn a doomed
  // process on EVERY hook. once the persisted streak EXCEEDS the cutoff, halt the respawn and
  // surface the trip until a human re-arms with route.reminder.gen (rule.forbid.behavior-hazards)
  const breakerBefore = await getRouteReminderCrashBreaker(clone);
  if (breakerBefore.count > MAX_ROUTE_REMINDER_CRASHES) {
    await surfaceRouteReminderFault(
      {
        from: input.route,
        error: new Error(
          `RouteReminder auto-respawn tripped: ${breakerBefore.count} consecutive crash-on-arrivals exceeded the ${MAX_ROUTE_REMINDER_CRASHES} cutoff — auto-respawn halts for this clone until a manual route.reminder.gen re-arms it`,
        ),
      },
      floor,
    );
    return { synced: 'circuit-broken' };
  }

  // an ACTIVE drive → findsert the clone's one daemon (a live daemon is returned, never duplicated)
  const { pid, created, alive } = await genRouteReminder(
    { ...clone, intervalMs: null, sayTimeoutMs: null },
    { spawnDaemon: context.spawnDaemon },
  );

  // a HEALTHY daemon (an extant live findsert-hit, or a fresh survivor) → reset the breaker
  if (!created || alive) {
    await delRouteReminderCrashBreaker(clone);
    return { synced: 'registered' };
  }

  // a fresh daemon that finds no focus exits at its first tick by design (route-not-live). that is
  // no crash, so it never counts toward the breaker: surface it and leave the clone deregistered
  const focusAfter = await getRouteReminderFocus(clone);
  if (!focusAfter) {
    await surfaceRouteReminderFault(
      {
        from: input.route,
        error: new Error(
          `RouteReminder daemon (pid ${pid}) exited at boot — the clone focus was absent, so it had no route to nudge about; the next drive writes the focus and registers afresh`,
        ),
      },
      floor,
    );
    return { synced: 'deregistered' };
  }

  // crash-on-arrival: a FRESH spawn already dead, with its focus in place. genRouteReminder OWNS the
  // detection + the dead-handle reconcile; this only counts the crash toward the cutoff and surfaces
  // it to the watched clone log, so a systematic boot failure is legible, never a silent spawn-storm
  await bumpRouteReminderCrashBreaker(clone);
  await surfaceRouteReminderFault(
    {
      from: input.route,
      error: new Error(
        `RouteReminder daemon (pid ${pid}) died on arrival — the spawn crashed before its first tick`,
      ),
    },
    floor,
  );
  return { synced: 'registered' };
};
