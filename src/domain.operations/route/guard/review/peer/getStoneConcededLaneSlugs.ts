import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getLiveReviewAbsorptions } from './getLiveReviewAbsorptions';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';
import { getStoneReviewCorpus } from './getStoneReviewCorpus';

/**
 * .what = the live absorptions that are CONCESSIONS — the filtered fold both concession reads share
 * .why = `computeConcededLaneSlugs` (which discards severity) and `computeConcessionExhaustionKind`
 *        (which reads it) both start from `getLiveReviewAbsorptions(...).filter(conceded)`. that fold
 *        is ONE operation, not two copies (r011 nitpick) — the slug read maps it to reviewers, the
 *        kind read inspects severity, but both stand on this single filtered set.
 *
 * 🔴 `live` means AGAINST THE SLUG'S LATEST GIVEN — and that rule is `getLiveReviewAbsorptions`,
 *    never a filter spelled here.
 *
 * ⚠️ a DISPUTE does not count here. a dispute says the lane was wrong, so it sheds the
 *    concern from the tally and buys the lane naught; only a concede declares the round
 *    warranted, which is what makes a top-up the sanctioned remedy (S11).
 */
export const getLiveConcededAbsorptions = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
}): ReviewAbsorption[] =>
  getLiveReviewAbsorptions({
    absorptions: input.absorptions,
    givens: input.givens,
  }).filter((stance) => stance.status === 'conceded');

/**
 * .what = of the slugs given, the ones that carry a live CONCESSION
 * .why = the exhaustion halt's third clause (S12). a halt that names concessions must
 *        only fire where a concession actually stands — an exhausted lane the driver
 *        never conceded is an ordinary human wait, and a concession-worded halt would
 *        lie about both the reason and the owner.
 */
export const computeConcededLaneSlugs = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
  slugs: string[];
}): string[] => {
  const conceded = new Set(
    getLiveConcededAbsorptions({
      absorptions: input.absorptions,
      givens: input.givens,
    }).map((stance) => stance.reviewer),
  );

  // preserve the caller's order — the halt names the slugs in the order it skipped them
  return input.slugs.filter((slug) => conceded.has(slug));
};

/**
 * .what = the exhausted lanes that carry a live concession, right now
 * .why = the exhaustion halt reads this to decide WHOSE halt it is. every skipped lane
 *        conceded ⇒ the remedy is a budget top-up, which is the driver's own lever, so
 *        no human is owed. any skipped lane NOT conceded ⇒ the ordinary human wait.
 */
export const getStoneConcededLaneSlugs = async (input: {
  route: string;
  stone: string;
  slugs: string[];
}): Promise<string[]> => {
  // naught to ask about — skip both reads
  if (input.slugs.length === 0) return [];

  const { absorptions, givens } = await getStoneReviewCorpus({
    route: input.route,
    stone: input.stone,
  });

  return computeConcededLaneSlugs({ absorptions, givens, slugs: input.slugs });
};

/**
 * .what = the kind of exhaustion halt this budget hit is — by whose lever ends it
 * .why = the severity split (F028/S14). the exhaustion verdict is three-way, never two:
 *
 *        | the skipped lanes | verdict | whose halt |
 *        |---|---|---|
 *        | NOT all conceded | `none`   | the ordinary human wait |
 *        | all conceded, no `urgent` | `better` | the driver's own — push, no human |
 *        | all conceded, ≥1 `urgent` | `urgent` | needs increased budget — warn the human |
 *
 *        ⇒ `define.invariant.review.peer.budget.urgent-earns-budget`: a `better` hit is
 *        the maintenance floor met (good enough, proceed); an `urgent` hit ships nameable
 *        harm, so it earns a human's glance and a round.
 *
 * .note = an ungraded concede is read as `better` — the ledger carries `severity?` absent
 *         on a legacy row, and the maintenance floor is the safe default (a mis-graded
 *         `urgent` earns a round it did not warrant; a mis-graded `better` never earns one).
 */
export type ConcessionExhaustionKind = 'none' | 'better' | 'urgent';

export const computeConcessionExhaustionKind = (input: {
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
  slugs: string[];
}): ConcessionExhaustionKind => {
  // no skipped lane ⇒ no concession exhaustion. `[].every` is vacuously true, so without
  // this guard an empty set would fall through to `better` — the ordinary wait is `none`.
  if (input.slugs.length === 0) return 'none';

  const liveConceded = getLiveConcededAbsorptions({
    absorptions: input.absorptions,
    givens: input.givens,
  });

  const concededSlugs = new Set(liveConceded.map((stance) => stance.reviewer));
  const skippedSlugs = new Set(input.slugs);

  // any skipped lane the driver never conceded ⇒ an ordinary human wait
  if (!input.slugs.every((slug) => concededSlugs.has(slug))) return 'none';

  // every lane conceded — the severity of the concessions on the skipped lanes decides.
  // an absent severity is read as `better` (the maintenance floor, F028/S14).
  const anyUrgent = liveConceded.some(
    (stance) =>
      skippedSlugs.has(stance.reviewer) && stance.severity === 'urgent',
  );
  return anyUrgent ? 'urgent' : 'better';
};

/**
 * .what = the concession-exhaustion kind for a stone's skipped lanes, right now
 * .why = the single read the write gate and both drive surfaces call to classify a budget
 *        hit — one route read, one rule (`getLiveReviewAbsorptions`), no drift.
 */
export const getStoneConcessionExhaustionKind = async (input: {
  route: string;
  stone: string;
  slugs: string[];
}): Promise<ConcessionExhaustionKind> => {
  // naught to ask about — a budget hit with no skipped lane is the ordinary wait
  if (input.slugs.length === 0) return 'none';

  const { absorptions, givens } = await getStoneReviewCorpus({
    route: input.route,
    stone: input.stone,
  });

  return computeConcessionExhaustionKind({
    absorptions,
    givens,
    slugs: input.slugs,
  });
};
