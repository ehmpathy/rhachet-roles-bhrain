import type { RouteStoneGuardBlockerReport } from '@src/domain.objects/Driver/RouteStoneGuardBlockerReport';

import { setStoneGuardBlockerReport } from '../drive/setStoneGuardBlockerReport';

/**
 * .what = the shared tail for a setStoneAsPassed blocked return
 * .why = the blocker-report blocked branches (review.self, exhausted,
 *        uncontemplated, judge-fail) all persist a blocker report and then
 *        return the same `{ passed: false, refs, emit }` shape. this centralizes
 *        that persist+return so a new blocked branch cannot drift from the shape.
 *
 * .note = stamp-agnostic on purpose: the caller passes the emit it wants
 *         returned (stamped via stampGuardReport when peer reviews ran, or raw
 *         when they did not — as the review.self branch does), so this helper
 *         never has to know about the stamp.
 *
 * .note = the malfunction and constraint branches do NOT use this helper: they
 *         persist a PassageReport with a distinct status ('malfunction' /
 *         'blocked') rather than a blocker report, so a shared persist here would
 *         require a persist-type switch (a wrong abstraction). they keep their
 *         own persist and share only the return shape by construction.
 */
export const genStoneGuardBlockedEmit = async (input: {
  stone: string;
  route: string;
  blocker: RouteStoneGuardBlockerReport['blocker'];
  reason: string;
  refs: { reviews: string[]; judges: string[] };
  emit: { stdout: string; stderr?: string };
}): Promise<{
  passed: false;
  refs: { reviews: string[]; judges: string[] };
  emit: { stdout: string; stderr?: string };
}> => {
  // persist the blocker report so the stophook can render the reason later
  await setStoneGuardBlockerReport({
    stone: input.stone,
    route: input.route,
    blocker: input.blocker,
    reason: input.reason,
  });

  // return the standard blocked shape
  return { passed: false, refs: input.refs, emit: input.emit };
};
