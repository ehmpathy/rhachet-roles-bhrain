import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getRouteReminderDriveActivity } from './getRouteReminderDriveActivity';
import { getRouteReminderFocus } from './getRouteReminderFocus';
import { isRouteReminderRefocusOwed } from './isRouteReminderRefocusOwed';
import { REMINDER_NUDGE_PROSE } from './REMINDER_NUDGE_PROSE';

/**
 * .what = the outcome of one RouteReminder tick
 * .why = the daemon loop reads this to decide whether to sleep-and-repeat or die. an `exit`
 *        outcome names WHY (a dead focus route, a completed drive, or a dead session), and every
 *        outcome names the focus route it judged, so the loop and the logs stay legible.
 */
export type RouteReminderTickOutcome =
  | {
      action: 'nudged';
      route: string;
      status: PassageReport['status'] | null;
    }
  | {
      action: 'exit';
      reason: 'route-not-live' | 'route-complete' | 'session-dead';
      route: string | null;
      status: PassageReport['status'] | null;
    };

/**
 * .what = the doors a tick can exit through — a dead route, a completed route, or a dead session
 * .why = the single source of truth for the exit-reason union. the daemon loop surfaces this same
 *        value, so it derives the type from here rather than re-declare a hand-copied literal.
 */
export type RouteReminderExitReason = Extract<
  RouteReminderTickOutcome,
  { action: 'exit' }
>['reason'];

/**
 * .what = runs one RouteReminder tick — the daemon's whole per-cycle decision
 * .why = this is the deterministic heart of the no-infiniloop guarantee. each cycle it reads which
 *        route the clone drives now (the focus), reads that route's liveness from disk, and either
 *        injects the nudge or exits. no model sits in the exit path.
 *
 * the doors:
 * - **route-not-live** — no focus was ever written, or the focus route's latest passage says the
 *   drive cannot self-advance. a daemon never nudges about a guess
 * - **route-complete** — every stone of the focus route passed, no next stone
 * - **session-dead** — `sayToClone` could not reach the clone, so the driver session is gone
 *
 * .note = the focus is read EVERY tick. a clone that moves to another route refocuses this daemon
 *         with one focus write; the next nudge is about the new route, and no daemon came or went
 *
 * .note = `sayToClone` is the injected `rhx clone say` boundary. an UNreachable clone is an EXPECTED
 *         signal (the dead-session door), NOT an error to swallow (rule.forbid.failhide)
 */
export const stepRouteReminderTick = async (
  input: { repoRoot: string; cloneAddr: string; sayTimeoutMs: number },
  context: {
    sayToClone: (input: {
      addr: string;
      what: string;
      timeoutMs?: number;
    }) => Promise<{ reached: true } | { reached: false; reason: string }>;
  },
): Promise<RouteReminderTickOutcome> =>
  stepTickWithRefocuses({ ...input, refocusesLeft: 1 }, context);

/**
 * .what = one tick, with a bound on how many times a focus moved mid-tick is judged afresh
 * .why = a drive can move the focus to a live route after this tick read a dead one, then see this
 *        daemon live and spawn none. so before the tick exits on a dead focus, it re-reads the focus;
 *        a focus that moved is judged once more, and the daemon nudges about the route driven now.
 *        the bound keeps a focus that flaps from spin
 */
const stepTickWithRefocuses = async (
  input: {
    repoRoot: string;
    cloneAddr: string;
    sayTimeoutMs: number;
    refocusesLeft: number;
  },
  context: Parameters<typeof stepRouteReminderTick>[1],
): Promise<RouteReminderTickOutcome> => {
  // read the route the clone drives now. no focus → no route to nudge about → exit
  const focus = await getRouteReminderFocus({
    repoRoot: input.repoRoot,
    cloneAddr: input.cloneAddr,
  });
  if (!focus)
    return {
      action: 'exit',
      reason: 'route-not-live',
      route: null,
      status: null,
    };

  // read whether the focus route is an active self-advanceable drive — the SAME composite the drive
  // sync and the manual cli read, so all three can never disagree on "is the route still live"
  const activity = await getRouteReminderDriveActivity({ route: focus.route });

  // a dead focus, but a drive moved the focus since this tick read it → judge the new focus
  const isRefocusOwed = await isRouteReminderRefocusOwed({
    ...input,
    isActive: activity.active,
    route: focus.route,
  });
  if (isRefocusOwed)
    return stepTickWithRefocuses(
      { ...input, refocusesLeft: input.refocusesLeft - 1 },
      context,
    );

  if (!activity.active)
    return {
      action: 'exit',
      reason: activity.reason,
      route: focus.route,
      status: activity.status,
    };

  // inject the nudge into the driver session, bounded by the threaded say-timeout
  const said = await context.sayToClone({
    addr: input.cloneAddr,
    what: REMINDER_NUDGE_PROSE,
    timeoutMs: input.sayTimeoutMs,
  });

  // an unreachable clone IS the dead-session signal → tear the daemon down.
  //
  // .tradeoff = this exits on the FIRST failed reach, with no retry. the hard requirement is "no
  //   infiniloops" — a stale daemon must never linger. the accepted cost is a false-positive exit
  //   on a one-tick blip; route.drive re-findserts a fresh daemon on the NEXT live drive, so the
  //   blip self-heals while the route stays live
  if (!said.reached)
    return {
      action: 'exit',
      reason: 'session-dead',
      route: focus.route,
      status: activity.status,
    };

  // the nudge landed → the daemon lives another cycle
  return { action: 'nudged', route: focus.route, status: activity.status };
};
