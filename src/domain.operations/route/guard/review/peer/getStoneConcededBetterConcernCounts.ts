import { asConcernCountsFromAbsorptions } from './asConcernCountsFromAbsorptions';
import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getLiveReviewAbsorptions } from './getLiveReviewAbsorptions';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';
import { getStoneReviewCorpus } from './getStoneReviewCorpus';

/**
 * .what = counts the `better`-conceded concerns that stand against the CURRENT generation
 * .why = a `better` concession is hard-capped by the budget, by design (S14/S16). the judge
 *        only runs at terminality, so a `better` concession that survives to the judge is one
 *        the driver could not fix within budget — the maintenance floor was met, and it now
 *        passes as tech debt that evolves later. so the judge SUBTRACTS these from its tally,
 *        exactly as it subtracts disputes, and an all-`better` residual clears with NO budget
 *        increase and NO human (`define.invariant.review.peer.budget.urgent-earns-budget`).
 *
 * 🔴 an `urgent` concession is NOT counted here — it ships nameable harm, so it KEEPS the hold
 *    and earns a human's glance and a round. an ungraded concede is read as `better` (the
 *    maintenance floor is the safe default; a mis-graded `better` never earns a round).
 *
 * 🔴 it keys each stance to the slug's LATEST given via `getLiveReviewAbsorptions` — the same
 *    per-generation rule the disputed count reads, so a fixed-and-re-approved lane's stale
 *    concession does not subtract.
 */
export const computeConcededBetterConcernCounts = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
}): { blockers: number; nitpicks: number } => {
  const live = getLiveReviewAbsorptions({
    absorptions: input.absorptions,
    givens: input.givens,
  });

  // a positive match on the closed set {better, undefined} — never a negative match on
  // `!== 'urgent'`, which would silently read a future third severity (or a corrupt row)
  // as the maintenance floor rather than fail loud on it (r007 nitpick.1, i006)
  return asConcernCountsFromAbsorptions(
    live.filter(
      (stance) =>
        stance.status === 'conceded' &&
        (stance.severity === 'better' || stance.severity === undefined),
    ),
  );
};

/**
 * .what = the `better`-conceded concern counts that stand on one stone, right now
 * .why = the `reviewed?` judge subtracts these from its tally, so an all-`better` residual
 *        passes untouched while an `urgent` concession still holds the road (S16)
 */
export const getStoneConcededBetterConcernCounts = async (input: {
  route: string;
  stone: string;
}): Promise<{ blockers: number; nitpicks: number }> => {
  const { absorptions, givens } = await getStoneReviewCorpus({
    route: input.route,
    stone: input.stone,
  });

  return computeConcededBetterConcernCounts({ absorptions, givens });
};
