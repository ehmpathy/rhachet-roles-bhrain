import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import type { RouteDriveFrontier } from '../stones/getRouteDriveFrontier';
import { bumpRouteReminderCrashBreaker } from './bumpRouteReminderCrashBreaker';
import { delRouteReminder } from './delRouteReminder';
import { delRouteReminderCrashBreaker } from './delRouteReminderCrashBreaker';
import { genRouteReminder } from './genRouteReminder';
import { getRouteDriverCloneAddr } from './getRouteDriverCloneAddr';
import { getRouteReminderCrashBreaker } from './getRouteReminderCrashBreaker';
import { getRouteReminderDriveActivity } from './getRouteReminderDriveActivity';
import { MAX_ROUTE_REMINDER_CRASHES } from './MAX_ROUTE_REMINDER_CRASHES';
import { surfaceRouteReminderFault } from './surfaceRouteReminderFault';

/**
 * .what = reconciles a driver session's RouteReminder against the route's live state, on every drive
 * .why = this is the wish's headline — "the route system upserts the reminder into cron as needed…
 *        halt it when the route is blocked". route.drive runs as an onBoot/onStop hook INSIDE the
 *        driver clone, continuously while a route is inflight, so it is the natural pulse to
 *        upsert the reminder from: each drive findserts the reminder when the route is a live
 *        drive, and reaps it when the route is dead. no human runs `route.reminder.gen` by hand —
 *        the drive wires it automatically (vision Q9, now in-scope).
 *
 * .why idempotent = both arms are safe to repeat every drive: genRouteReminder is a findsert (a
 *        live daemon is returned, never duplicated), and delRouteReminder is a no-op on an
 *        already-absent reminder. so a re-run on EVERY drive converges, never accretes — the same
 *        discipline the bouncer-cache write follows (it too rewrites on every drive).
 *
 * .why the addr gate = a reminder needs the driver's OWN clone address so the daemon's
 *        `rhx clone say @:<addr>` targets THIS session. getRouteDriverCloneAddr reads it from
 *        the enroller-injected env; a plain (non-enrolled) session has none, so there is no
 *        session to nudge → skip (rule.forbid.failhide — the absent addr is a skip, not a fault).
 *
 * .note = the active-drive read is getRouteReminderDriveActivity — the SAME composite the daemon's
 *         own tick uses to self-exit. so auto-stop here and the daemon's self-exit key on one
 *         predicate; they can never disagree about "is the route still a live drive". the daemon
 *         self-exits on its own next tick regardless; this reap is the in-repo backstop that tears
 *         down promptly on the drive that observed death.
 *
 * .note completion = the composite folds in the stone-frontier check: a COMPLETED route — every
 *         stone passed, no next stone — writes the SAME `passed` tail as a mid-route pause, so the
 *         status predicate alone reads it as LIVE and would keep the reminder up forever (the wish's
 *         forbidden infiniloop). getRouteDriveComplete (inside the composite) reads computeNextStones
 *         (the SAME op stepRouteDrive uses for its own completion test), so a completed drive is
 *         inactive and reaps here too. register requires a live status AND a NOT-complete drive.
 *
 * .note = `spawnDaemon` is the injected host boundary (spawn/host of a background process is the
 *         enroller tool's concern); a test drives this with a fake spawn, deterministic, no real
 *         detached child (rule.require.dependency-injection).
 *
 * .note circuit breaker = because this runs on EVERY drive hook, a SYSTEMATICALLY-broken spawn (not a
 *         one-off flake) would crash-on-arrival and re-spawn a doomed process on every turn boundary —
 *         an unbounded spawn-storm. so a persisted per-session crash-on-arrival counter
 *         (RouteReminderCrashBreaker) trips a cutoff (MAX_ROUTE_REMINDER_CRASHES): once EXCEEDED, this
 *         halts the respawn and surfaces the trip until a human re-arms with a manual route.reminder.gen.
 *         a healthy daemon resets the counter (the streak is broken). this mirrors the drive's own
 *         DriveBlockerState/maxBlocks cutoff — a proven primitive, not a new mechanism.
 *
 * .note = the optional pre-read `frontier` lets stepRouteDrive hand down its already-computed stone
 *         frontier so the activity read below reuses it instead of a second disk read — one snapshot
 *         drives both the reminder's reap gate and the drive's own next-stone pick, atomic per hook
 *         call. omitted, the activity read stays lazy (a dead-status route reads no frontier).
 *
 * .note = the optional pre-read `latest` is the passage twin of `frontier`: stepRouteDrive reads
 *         passage.jsonl once per hook, so it threads that single snapshot here rather than let the
 *         reminder's liveness check do a SECOND independent full-file read. this honors the same
 *         read-once discipline stepRouteDrive documents for its other passage reads (no TOCTOU
 *         split between the reminder's view of the drive and the drive's own). omitted, the
 *         liveness read stays lazy (the daemon tick + manual cli read it themselves).
 */
export const syncRouteReminderForDrive = async (
  input: {
    route: string;
    frontier?: RouteDriveFrontier;
    latest?: PassageReport | null;
  },
  context: {
    spawnDaemon: (input: {
      route: string;
      cloneAddr: string;
      intervalMs: number;
      sayTimeoutMs: number;
    }) => Promise<{ pid: number }>;
  },
): Promise<{
  synced: 'registered' | 'deregistered' | 'skipped' | 'circuit-broken';
}> => {
  // a reminder needs the driver's own clone address; a plain session (no enroller) has none → skip
  const driver = getRouteDriverCloneAddr();
  if (!driver) return { synced: 'skipped' };

  // read whether the route is an active self-advanceable drive — the SAME composite predicate the
  // daemon's own tick reads to self-exit (getRouteReminderDriveActivity), so auto-stop here and the
  // daemon's self-exit can never disagree on "is the route still a live drive". thread the caller's
  // pre-read frontier + passage `latest` (if any) so the completion + liveness checks reuse them,
  // no second frontier or passage read — one hook, one snapshot of each (rule.forbid.behavior-hazards).
  const activity = await getRouteReminderDriveActivity({
    route: input.route,
    frontier: input.frontier,
    latest: input.latest,
  });

  // an ACTIVE drive (live status AND not complete) → findsert the reminder (idempotent findsert)
  if (activity.active) {
    // CIRCUIT BREAKER: the auto-wire runs on every route.drive hook (every turn boundary). a
    // SYSTEMATICALLY-broken spawn crashes on arrival and would re-spawn a fresh doomed process on
    // EVERY hook — an unbounded spawn-storm across exactly the host outage the reminder exists to
    // survive. so read the persisted consecutive crash-on-arrival count first; once it EXCEEDS the
    // cutoff, halt the respawn and surface the trip, until a human re-arms with a manual
    // route.reminder.gen (which resets the breaker). this reuses the drive's own consecutive-block
    // cutoff shape (DriveBlockerState / maxBlocks) rather than a new mechanism
    // (rule.prefer.decomposable-architecture, rule.forbid.behavior-hazards).
    const breakerBefore = await getRouteReminderCrashBreaker({
      route: input.route,
      cloneAddr: driver.cloneAddr,
    });
    if (breakerBefore.count > MAX_ROUTE_REMINDER_CRASHES) {
      await surfaceRouteReminderFault({
        route: input.route,
        error: new Error(
          `RouteReminder auto-respawn tripped: ${breakerBefore.count} consecutive crash-on-arrivals exceeded the ${MAX_ROUTE_REMINDER_CRASHES} cutoff — auto-respawn halts for this session until a manual route.reminder.gen re-arms it`,
        ),
      });
      return { synced: 'circuit-broken' };
    }

    const { pid, created, alive } = await genRouteReminder(
      {
        route: input.route,
        cloneAddr: driver.cloneAddr,
        intervalMs: null,
        sayTimeoutMs: null,
      },
      { spawnDaemon: context.spawnDaemon },
    );

    // crash-on-arrival: a FRESH spawn (created) already dead means the daemon failed to boot (a
    // broken host, a bad node binary). genRouteReminder now OWNS the detection + the dead-handle
    // reconcile (its findsert postcondition), so the auto-wire only SURFACES the crash — no
    // re-derived isProcessAlive probe, no duplicated reconcile (rule.require.directional-deps). the
    // surface goes to the WATCHED per-session log so a SYSTEMATIC boot failure — which would spawn a
    // fresh doomed process on EVERY drive hook — is legible, not a silent spawn-storm
    // (rule.forbid.failhide). the drive still proceeds; the reminder is an auxiliary continuity aid.
    if (created && !alive) {
      // bump the crash-breaker toward the cutoff (this counts one more consecutive crash-on-arrival)
      await bumpRouteReminderCrashBreaker({
        route: input.route,
        cloneAddr: driver.cloneAddr,
      });
      await surfaceRouteReminderFault({
        route: input.route,
        error: new Error(
          `RouteReminder daemon (pid ${pid}) died on arrival — the spawn crashed before its first tick`,
        ),
      });
    } else {
      // a HEALTHY daemon (an extant live findsert-hit, or a fresh survivor) → reset the breaker; the
      // spawn works, so the consecutive crash streak is broken (rule.forbid.behavior-hazards).
      await delRouteReminderCrashBreaker({
        route: input.route,
        cloneAddr: driver.cloneAddr,
      });
    }
    return { synced: 'registered' };
  }

  // a dead drive (blocked / rewound / exhausted / malfunction) OR a COMPLETED drive → reap the
  // reminder (no-op if absent)
  await delRouteReminder({ route: input.route, cloneAddr: driver.cloneAddr });
  return { synced: 'deregistered' };
};
