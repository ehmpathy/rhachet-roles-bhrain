import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getLiveConcededAbsorptions } from './getStoneConcededLaneSlugs';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';
import { getStoneReviewCorpus } from './getStoneReviewCorpus';

/**
 * .what = of a stone's live concessions, the reviewer slugs graded URGENT
 * .why = the pure half of the read below, so the budget gate's WARRANT can be pinned by a unit
 *        test. the async wrapper owns the route read; this owns the rule.
 *
 * 🔴 .the equality carries weight, and its inverse is NOT a synonym. `severity` is optional on
 *    the ledger row (`PassageReport.severity?`), so a row written before the field existed carries
 *    none:
 *
 *    | the filter | a legacy row with no severity | fails |
 *    |---|---|---|
 *    | `severity === 'urgent'`  | dropped  | CLOSED — no warrant is minted from a row that never graded |
 *    | `severity !== 'better'`  | KEPT     | OPEN — every ungraded row becomes a warrant |
 *
 *    ⇒ the two state one intent in a diff and behave oppositely on the legacy corpus, so the
 *    closed-set equality is pinned by a test rather than left to a reviewer's eye.
 *
 * 🟡 .note = an ungraded row that falls to `better` is the SAME default
 *    `computeConcessionExhaustionKind` takes, and for the same reason — a mis-graded `better`
 *    earns no round, where a mis-graded `urgent` earns one it did not warrant (F028/S14).
 *
 * .note = the live ∧ conceded fold is `getLiveConcededAbsorptions`, reused rather than respelled
 *         — a third copy of that filter is the r011 nitpick its own docblock records.
 */
export const computeLiveUrgentConcessionSlugs = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
}): string[] => {
  const urgentSlugs = getLiveConcededAbsorptions({
    absorptions: input.absorptions,
    givens: input.givens,
  })
    .filter((stance) => stance.severity === 'urgent')
    .map((stance) => stance.reviewer);

  // dedupe: one reviewer may carry several urgent concerns, but names the human once
  return [...new Set(urgentSlugs)];
};

/**
 * .what = the reviewer slugs that carry a LIVE, URGENT concession on this stone
 * .why = two consumers read it, and each asks the same question — did a concession earn a round?
 *
 *        1. the `reviewed?` judge holds a stone when the concern sum exceeds the allowances, and a
 *           CONCEDED concern is kept in that sum. so the judge names the human an urgent concession
 *           is owed, the same way the `approved?` judge names the human who must approve
 *           (`define.invariant.review.peer.judge.urgent-guides-the-budget-ask`).
 *
 *        2. 🔴 the budget GATE reads it as the WARRANT. `route.guard.budget --add N` is refused by
 *           default, and a live urgent concession is the first of three conjuncts that lift the
 *           refusal (`computeBudgetGrantRefusal`). ⇒ a driver who can name a shipped harm takes
 *           the round itself, with no human at all.
 *
 * 🟡 .note = so the two consumers now disagree about WHO acts on the same fact: the judge names a
 *         human, and the gate hands the round to the driver. that divergence is fulcrum F03 of
 *         `v2026_09_17.fix-budget-grant-needs-urgent-concession`, and it is UNRULED — the judge's
 *         copy is deliberately untouched until a council rules it.
 *
 * .note = a `better` concession (or none) is NOT here, and past a spent meter it earns NO round.
 *         its remedy is the FIX the driver already named, never a top-up
 *         (`define.invariant.review.peer.budget.urgent-earns-budget`; F04, ruled). inside the
 *         budget, the rounds the route author bought already cover taste; past it, only harm buys
 *         more.
 *
 * .note = live = keyed to the slug's LATEST given (S03's per-generation lapse). a stance declared
 *         against a prior generation has lapsed and summons no human.
 */
export const getStoneLiveUrgentConcessionSlugs = async (input: {
  route: string;
  stone: string;
}): Promise<string[]> => {
  const { absorptions, givens } = await getStoneReviewCorpus({
    route: input.route,
    stone: input.stone,
  });

  return computeLiveUrgentConcessionSlugs({ absorptions, givens });
};
