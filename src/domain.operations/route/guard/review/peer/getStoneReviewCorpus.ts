import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getAllRouteGuardReviewPeerGivens } from './getAllRouteGuardReviewPeerGivens';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';
import { getStoneReviewAbsorptions } from './getStoneReviewAbsorptions';

/**
 * .what = the two reads every stance-grade gate folds over — every declared absorption on
 *         this stone, and every reviewer's latest given
 * .why = the `(absorptions, givens)` pair was read inline via its own `Promise.all` at ~9
 *        call sites — the judge's tally exclusion, the dispute skip, the concession-
 *        exhaustion halt, the entrance stance gate, the write path, and more. each copy
 *        decides independently what "the live corpus" means over the same ledger, so a
 *        future change to either read (the latest-per-slug pick, the rewind-void, the
 *        malformed-row throw) lands once and the rest silently drift — different gates on
 *        the same stone, in the same round, could grasp a different "live" stance set
 *        (r007 blocker.1, i006; rule.forbid.behavior-hazards). one communicator
 *        single-sources the pair so every gate composes the same corpus.
 */
export const getStoneReviewCorpus = async (input: {
  route: string;
  stone: string;
}): Promise<{
  absorptions: ReviewAbsorption[];
  givens: RouteGuardReviewPeerGiven[];
}> => {
  const [absorptions, givens] = await Promise.all([
    getStoneReviewAbsorptions({ route: input.route, stone: input.stone }),
    getAllRouteGuardReviewPeerGivens({
      route: input.route,
      stone: input.stone,
    }),
  ]);
  return { absorptions, givens };
};
