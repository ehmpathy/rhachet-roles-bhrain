import { asConcernCountsFromAbsorptions } from './asConcernCountsFromAbsorptions';
import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getLiveReviewAbsorptions } from './getLiveReviewAbsorptions';
import type { ReviewAbsorption } from './ReviewAbsorption';

/**
 * .what = counts the disputed concerns that stand against the CURRENT generation
 * .why = a dispute is a tally exclusion, and S07 fixes its grain at ONE concern — so a
 *        dispute is worth exactly 1, and the arithmetic is a count rather than a lookup.
 *
 * 🔴 it keys each stance to the slug's LATEST given — via `getLiveReviewAbsorptions`, which is
 *    where S03's per-generation lapse lives. `computeConcededLaneSlugs` reads the identical
 *    rule, so it is one operation rather than two copies that agree by promise.
 *
 * ⚠️ a CONCEDE subtracts naught. it declares the reviewer right, so the concern still counts
 *    and the hold it earns is the extant one.
 *
 * .note = `scope` narrows to ONE lane, on the `getOneRouteGuardReviewPeerFeedbackAbsorptionStatus`
 *         precedent. the judge tallies stone-wide; the per-round skip asks per lane.
 */
export const computeDisputedConcernCounts = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
  scope?: { slug: string };
}): { blockers: number; nitpicks: number } => {
  const live = getLiveReviewAbsorptions({
    absorptions: input.absorptions,
    givens: input.givens,
  });

  // the disputed concerns in scope — a pure filter, then the shared per-severity count fold
  return asConcernCountsFromAbsorptions(
    live.filter(
      (stance) =>
        stance.status === 'disputed' &&
        (!input.scope || stance.reviewer === input.scope.slug),
    ),
  );
};
