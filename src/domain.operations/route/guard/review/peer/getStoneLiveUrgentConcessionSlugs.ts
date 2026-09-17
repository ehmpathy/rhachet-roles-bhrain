import { getLiveReviewAbsorptions } from './getLiveReviewAbsorptions';
import { getStoneReviewCorpus } from './getStoneReviewCorpus';

/**
 * .what = the reviewer slugs that carry a LIVE, URGENT concession on this stone
 * .why = the `reviewed?` judge holds a stone when the concern sum exceeds the allowances, and a
 *        CONCEDED concern is kept in that sum. an urgent concession's one honest remedy is a HUMAN
 *        budget grant, so the judge must name that human — the same way the `approved?` judge names
 *        the human who must approve
 *        (`define.invariant.review.peer.judge.urgent-guides-the-budget-ask`).
 *
 * .note = a `better` concession (or none) is NOT here — its remedy is the driver's OWN top-up, so
 *         the judge must name no human for it
 *         (`define.invariant.review.peer.budget.urgent-earns-budget`).
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

  const live = getLiveReviewAbsorptions({ absorptions, givens });

  // the reviewer slugs whose live stance is a conceded, urgent one
  const urgentSlugs = live
    .filter(
      (stance) => stance.status === 'conceded' && stance.severity === 'urgent',
    )
    .map((stance) => stance.reviewer);

  // dedupe: one reviewer may carry several urgent concerns, but names the human once
  return [...new Set(urgentSlugs)];
};
