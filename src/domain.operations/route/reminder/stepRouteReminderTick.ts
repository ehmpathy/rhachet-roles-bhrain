import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getRouteReminderDriveActivity } from './getRouteReminderDriveActivity';
import { REMINDER_NUDGE_PROSE } from './REMINDER_NUDGE_PROSE';

/**
 * .what = the outcome of one RouteReminder tick
 * .why = the daemon loop reads this to decide whether to sleep-and-repeat or die. an `exit`
 *        outcome names WHY (a dead route, a completed drive, or a dead session), so the loop
 *        and the logs stay legible.
 */
export type RouteReminderTickOutcome =
  | { action: 'nudged'; status: PassageReport['status'] | null }
  | {
      action: 'exit';
      reason: 'route-not-live' | 'route-complete' | 'session-dead';
      status: PassageReport['status'] | null;
    };

/**
 * .what = the two doors a tick can exit through — a dead route or a dead session
 * .why = the single source of truth for the exit-reason union. the daemon loop surfaces this
 *        same value, so it derives the type from here (`Extract` the exit arm) rather than
 *        re-declare a hand-copied literal that must move in lockstep.
 */
export type RouteReminderExitReason = Extract<
  RouteReminderTickOutcome,
  { action: 'exit' }
>['reason'];

/**
 * .what = runs one RouteReminder tick — the daemon's whole per-cycle decision
 * .why = this is the deterministic heart of U3's no-infiniloop guarantee. each cycle it reads
 *        the route's liveness from disk and either injects the nudge or exits. no model sits in
 *        the exit path: a dead route (blocked / rewound / exhausted / malfunction) or a dead
 *        session (the inject cannot reach the clone) each yield a clean `exit`, so the daemon
 *        loop tears itself down instead of a nudge at a corpse.
 *
 * the three exit doors:
 * - **route-not-live** — the latest passage status says the drive cannot self-advance
 * - **route-complete** — every stone passed, no next stone: a completed drive is a HALTED drive.
 *   the status predicate reads a terminal `passed` as LIVE (indistinct from a mid-route pause),
 *   so the stone frontier (getRouteDriveComplete) is the discriminator that lets the daemon
 *   self-exit on completion — the wish's hard "halt for any reason, no infiniloops" at the
 *   daemon layer itself, not only via the auto-wire reap on a later route.drive
 * - **session-dead** — `sayToClone` could not reach the clone (reach-state gate), so the
 *   driver session is gone; a stale daemon must not linger (vision U3 anti-clog)
 *
 * .note = `sayToClone` is the injected `rhx clone say` boundary. it returns a discriminated
 *         `{ reached }` result — an UNreachable clone is an EXPECTED signal (the dead-session
 *         door), NOT an error to swallow (rule.forbid.failhide). a genuinely unexpected fault
 *         throws from the communicator and propagates (fail-fast), never read here as
 *         "session dead".
 */
export const stepRouteReminderTick = async (
  input: { route: string; cloneAddr: string; sayTimeoutMs: number },
  context: {
    sayToClone: (input: {
      addr: string;
      what: string;
      timeoutMs?: number;
    }) => Promise<{ reached: true } | { reached: false; reason: string }>;
  },
): Promise<RouteReminderTickOutcome> => {
  // read whether the route is an active self-advanceable drive (the pure exit decision). a dead /
  // parked status (route-not-live) OR a completed drive (route-complete: terminal `passed`, empty
  // stone frontier) is inactive, so the daemon self-exits with the reason the composite named. this
  // is the SAME predicate the auto-wire and the manual cli read (rule.prefer.most-common-denominator),
  // so all three can never disagree on "is the route still a live drive".
  const activity = await getRouteReminderDriveActivity({ route: input.route });
  if (!activity.active)
    return {
      action: 'exit',
      reason: activity.reason,
      status: activity.status,
    };

  // inject the nudge into the driver session. the wall-clock bound on this `clone say` is the
  // threaded say-timeout (a hung inject must not wedge the tick — an operator widens it on a slow
  // machine via --say-timeout-ms, so a merely-slow-but-alive call is not read as a dead session).
  const said = await context.sayToClone({
    addr: input.cloneAddr,
    what: REMINDER_NUDGE_PROSE,
    timeoutMs: input.sayTimeoutMs,
  });

  // an unreachable clone IS the dead-session signal → tear the daemon down.
  //
  // .tradeoff = this exits on the FIRST failed reach, with no retry / backoff. that is a
  //   deliberate choice, not an oversight: the wish's HARD requirement is "no infiniloops" — a
  //   stale daemon must never linger. a retry would weaken that deterministic anti-clog guarantee
  //   (a truly-dead session could be nudged N more times before exit). the accepted cost is a
  //   false-positive cancellation: a clone momentarily unreachable for ONE tick (a network blip, a
  //   pty jam) ends the reminder for the rest of the route. the blast radius is bounded — the
  //   reminder is a best-effort nudge, not a correctness mechanism (an outage the nudge would have
  //   covered is itself rare). the recovery is in-repo: `route.drive` (syncRouteReminderForDrive)
  //   re-findserts a fresh daemon on the NEXT live drive after a false-positive exit — so a blip
  //   that ends this daemon self-heals on the driver's next boot/stop hook while the route stays
  //   live. the design favors the hard no-clog guarantee over per-tick retry robustness, by intent,
  //   because the drive-pulse re-register covers the transient-blip case without a retry loop here.
  if (!said.reached)
    return { action: 'exit', reason: 'session-dead', status: activity.status };

  // the nudge landed → the daemon lives another cycle
  return { action: 'nudged', status: activity.status };
};
