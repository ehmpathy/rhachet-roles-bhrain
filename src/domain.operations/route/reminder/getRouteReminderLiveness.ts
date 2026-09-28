import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getLatestPassageForRoute } from '../passage/getLatestPassageForRoute';
import { isReminderLiveForPassageStatus } from './isReminderLiveForPassageStatus';

// .note = the `../passage/` import is intra-context composition, NOT a cross-context scope leak.
//   `route/` is ONE bounded context; passage/, drive/, judges/, stones/, bouncer/, and reminder/
//   are its sub-clusters. passage/ owns the shared passage-state read that every route sub-cluster
//   consumes — drive/getStoneGuardBlockerReport imports `../passage/getLatestPassageForStone`
//   (the direct peer of the read below), judges/ and stones/ import `../passage/setPassageReport`,
//   bouncer/ imports `../passage/getOnePassageReport`. 17 route operations across 4 peer
//   sub-clusters import `../passage/` directly; this follows that identical, established
//   convention (rule.prefer.most-common-denominator — the shared read lives at the passage
//   sub-cluster, consumed by its peers). rule.forbid.scope-leaks guards CROSS-bounded-context
//   reaches (e.g. invoice → customer), not sub-cluster composition within one domain.

/**
 * .what = reads a route's latest passage status and decides if its RouteReminder is live
 * .why = the daemon's tick asks one question each cycle — should the reminder still fire, or
 *        should i exit? this is the deterministic read behind that decision: the single most
 *        recent passage write (the append-only `tail -1`) drives the whole call. no model in
 *        the path, so U3's no-infiniloop teardown is a pure file read.
 *
 * .note = reads the single LATEST entry across all stones (raw append order, last line), NOT
 *         a per-stone reduction. the route advances one stone at a time, so the last write is
 *         the drive's current state. an empty / absent passage.jsonl reads as NOT live — a
 *         route with no passage yet has no active drive to nudge.
 *
 * .note = an optional pre-read `latest` lets a caller thread its already-read passage snapshot
 *         (stepRouteDrive reads passage.jsonl once per hook and threads that one view) so the
 *         reminder read reuses it instead of a SECOND independent full-file read — the SAME
 *         single-read-threaded discipline stepRouteDrive applies to frontier + passageLatestByStone
 *         (no TOCTOU split between the reminder's view and the drive's own). `undefined` = not
 *         supplied → read here (the daemon tick + manual cli have none in hand); an explicit `null`
 *         = supplied-but-empty (a route with no passage yet), honored as not-live without a read.
 */
export const getRouteReminderLiveness = async (input: {
  route: string;
  latest?: PassageReport | null;
}): Promise<{ live: boolean; status: PassageReport['status'] | null }> => {
  // the drive's true-latest passage entry (the vision's `tail -1`): the caller's threaded snapshot
  // when supplied (undefined = none in hand → read it here, lazy for the tick / manual cli)
  const latest =
    input.latest !== undefined
      ? input.latest
      : await getLatestPassageForRoute({ route: input.route });

  // no passage yet → no active drive to nudge
  if (!latest) return { live: false, status: null };

  // apply the pure predicate to the latest status
  return {
    live: isReminderLiveForPassageStatus({ status: latest.status }),
    status: latest.status,
  };
};
