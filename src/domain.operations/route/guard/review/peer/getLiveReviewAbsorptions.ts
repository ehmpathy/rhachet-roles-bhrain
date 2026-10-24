import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getLatestPeerGivensPerSlug } from './getLatestPeerGivensPerSlug';
import { isReviewAbsorptionOnGiven } from './isReviewAbsorptionOnGiven';
import type { ReviewAbsorption } from './ReviewAbsorption';

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
 * 🟡 .note = `computeUndeclaredConcerns` iterates GIVENS rather than absorptions, so it does not
 *         call this; it holds `(given.slug, given.pathGiven)` already. the MATCH both share is
 *         one predicate, `isReviewAbsorptionOnGiven`, so the rule lands once while the shapes
 *         differ.
 */
export const getLiveReviewAbsorptions = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
}): ReviewAbsorption[] => {
  // 🔴 the latest given per slug by a TOTAL order, never the last of the input array.
  //    this pure fold trusts no caller's order or pre-pick (rule.forbid.order-dependence):
  //    a caller that hands every generation would otherwise key on whichever given came
  //    last. getLatestPeerGivensPerSlug is the one selector the debt and the tally share.
  const givensLatest = getLatestPeerGivensPerSlug({ givens: input.givens });

  // a stance is live while it answers some lane's latest given. the match (reviewer + given
  // key, never raw path) lives in isReviewAbsorptionOnGiven
  return input.absorptions.filter((absorption) =>
    givensLatest.some((given) =>
      isReviewAbsorptionOnGiven({
        absorption,
        reviewer: given.slug,
        given: given.pathGiven,
      }),
    ),
  );
};
