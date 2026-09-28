import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import type { RouteDriveFrontier } from '../stones/getRouteDriveFrontier';
import { getRouteDriveComplete } from './getRouteDriveComplete';
import { getRouteReminderLiveness } from './getRouteReminderLiveness';

/**
 * .what = whether a route is an ACTIVE self-advanceable drive — the single predicate behind
 *         "should the reminder fire?". active ⟺ the passage status is live-for-reminder AND the
 *         drive is not complete. when inactive, it names WHICH door closed it.
 * .why = three callers ask this exact question and MUST agree on the answer:
 *        - syncRouteReminderForDrive (the auto-wire) findserts iff active, reaps otherwise
 *        - stepRouteReminderTick (the daemon tick) self-exits iff inactive, and names the reason
 *        - routeReminderGen (the manual CLI) reports honest liveness iff active
 *        the answer is two disk reads: getRouteReminderLiveness (the tail-1 passage status) and
 *        getRouteDriveComplete (the stone frontier — a terminal `passed` reads LIVE by status
 *        alone, so completion needs the frontier). one composite here keeps all three aligned on
 *        what "active" means (rule.prefer.most-common-denominator).
 *
 * .note = the completion read runs ONLY when the status is live — a not-live status is already
 *         inactive, so the heavier stone-frontier read is skipped (a dead route needs no frontier).
 *
 * .note = an optional pre-read frontier threads a caller's already-computed snapshot straight to the
 *         completion check (stepRouteDrive reads the frontier once for its own next-stone pick, so
 *         the auto-wire reuses it rather than read it twice). callers with none in hand (the daemon
 *         tick, the manual cli) omit it — and the lazy skip above still holds: a not-live status
 *         returns before the completion read, so those callers never pay the frontier read.
 *
 * .note = an optional pre-read `latest` does the SAME for the passage read: stepRouteDrive reads
 *         passage.jsonl once per hook, so it threads its snapshot here instead of a second
 *         independent full-file read by the reminder (the passage twin of the frontier reuse above).
 */
export type RouteReminderDriveActivity =
  | { active: true; status: PassageReport['status'] | null }
  | {
      active: false;
      reason: 'route-not-live' | 'route-complete';
      status: PassageReport['status'] | null;
    };

export const getRouteReminderDriveActivity = async (input: {
  route: string;
  frontier?: RouteDriveFrontier;
  latest?: PassageReport | null;
}): Promise<RouteReminderDriveActivity> => {
  // the tail-1 passage status — a dead / parked status is inactive, no frontier read needed.
  // reuse the caller's threaded passage snapshot when supplied, else read it (lazy for the tick/cli)
  const { live, status } = await getRouteReminderLiveness({
    route: input.route,
    latest: input.latest,
  });
  if (!live) return { active: false, reason: 'route-not-live', status };

  // a live status still hides completion — a terminal `passed` reads LIVE, so the stone frontier
  // is the completion discriminator (a completed drive is a HALTED drive, not a nudge target).
  // reuse the caller's pre-read frontier when supplied, else read it here (lazy for dead routes).
  const { complete } = await getRouteDriveComplete({
    route: input.route,
    frontier: input.frontier,
  });
  if (complete) return { active: false, reason: 'route-complete', status };

  return { active: true, status };
};
