import { computeUndeclaredConcerns } from './computeUndeclaredConcerns';
import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import type { ReviewAbsorption } from './ReviewAbsorption';

/**
 * .what = what the stone still owes a stance on, across every lane EXCEPT the one just
 *         declared — the count, and the NEXT owed concern by lane and label
 * .why = the stance ack must tell a driver whether a cleared THIS lane leaves the stone clear or
 *        not (r9 n2), and when it does not, which command comes next. a count alone left the
 *        driver to hunt for the lane and the ordinal; the next concern makes the ack name a
 *        command the driver can run as printed.
 *
 * .note = it folds through the SAME pure `computeUndeclaredConcerns` the entrance gate reads, so
 *         the two grade one corpus by one predicate — no second read of the ledger. `next` is the
 *         first concern of the first owed lane, in the order that fold yields.
 */
export const computeConcernsElsewhere = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
  levelBySlug: Map<string, number>;
  overruledLevels: Set<number>;
  allowBlockers: number;
  allowNitpicks: number;
  /** the lane just declared, excluded from the "elsewhere" set */
  excludeSlug: string;
}): { count: number; next: { slug: string; about: string } | null } => {
  // the lanes other than this one that still owe a stance, each with ≥1 concern
  const lanesOwed = computeUndeclaredConcerns({
    absorptions: input.absorptions,
    givens: input.givens,
    levelBySlug: input.levelBySlug,
    overruledLevels: input.overruledLevels,
    allowBlockers: input.allowBlockers,
    allowNitpicks: input.allowNitpicks,
  }).filter(
    (lane) => lane.slug !== input.excludeSlug && lane.concerns.length > 0,
  );

  // the count sums every owed concern; the next is the first one a driver would reach
  const count = lanesOwed.reduce((sum, lane) => sum + lane.concerns.length, 0);
  const laneFirst = lanesOwed[0];
  const next = laneFirst
    ? { slug: laneFirst.slug, about: laneFirst.concerns[0]! }
    : null;
  return { count, next };
};
