import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getLatestPeerGivensPerSlug } from './getLatestPeerGivensPerSlug';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';

/**
 * .what = of the absorptions given, the ones still keyed to their slug's LATEST given
 * .why = S03's per-generation lapse, and it is ONE rule with two readers — the concession
 *        halt asks it of conceded absorptions, the judge's tally exclusion asks it of disputed
 *        ones. both were spelled inline, in five identical lines, and the comment that sat
 *        above one of them promised they were "deliberately the same shape".
 *
 * 🔴 .why it is its own operation
 *
 *    a promise that two copies agree is a manual-discipline contract, which is the defect
 *    `asSanitizedPeerReviewSlug`'s own note names — two inline copies that "agreed by
 *    coincidence, not by construction". and the lapse rule is the one most likely to move:
 *    it is the mechanism S03 chose over a second record to maintain, so a change to what
 *    "lapsed" means (a hash key, an N-generation window) must land once rather than twice.
 *
 *    ⚠️ and this change had already set the bar at TWO callers, one layer down:
 *       `getDisputeSkippedReviewerSlugs` extracted a ONE-line filter because "both read the
 *       same question ... off the same meter list". a five-line predicate read by two callers
 *       is the same case with more code, so to leave it inline is the inconsistency.
 *
 * .note = a stance whose given is not its slug's latest has lapsed — the lane spoke again,
 *         so it re-raised (or dropped) the point on its own, and the driver re-declares.
 *
 * 🟡 .note = `computeUndeclaredConcerns` encodes the same rule and does NOT call this. it
 *         iterates GIVENS rather than absorptions, so it holds the pair `(given.slug,
 *         given.pathGiven)` already and matches against it directly. to route it through
 *         here would build a Map to recover what its loop variable carries — the rule is
 *         shared, the shape is not.
 */
export const getLiveReviewAbsorptions = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
}): ReviewAbsorption[] => {
  // 🔴 the latest given per slug by a TOTAL order, never the last of the input array.
  //    input.givens is raw glob output (rule.forbid.order-dependence), so a plain
  //    `input.givens.map` would key on whichever given globbed last — right on one
  //    machine, wrong on another. getLatestPeerGivensPerSlug is the one selector both
  //    the debt and the tally already read through.
  const pathGivenLatestBySlug = new Map(
    getLatestPeerGivensPerSlug({ givens: input.givens }).map((one) => [
      one.slug,
      one.pathGiven,
    ]),
  );

  return input.absorptions.filter(
    (stance) => pathGivenLatestBySlug.get(stance.reviewer) === stance.given,
  );
};
