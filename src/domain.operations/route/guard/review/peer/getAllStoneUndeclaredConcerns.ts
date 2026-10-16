import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getStoneGuardOverruledLevels } from '../../../judges/getStoneGuardOverruledLevels';
import { asPeerReviewLevelBySlug } from './asPeerReviewLevelBySlug';
import {
  computeUndeclaredConcerns,
  type RouteGuardReviewPeerUndeclared,
} from './computeUndeclaredConcerns';
import { getStoneReviewCorpus } from './getStoneReviewCorpus';
import { getReviewedJudgeThresholds } from './meter/getReviewedJudgeThresholds';

/**
 * .what = the concerns this stone still owes a stance on, right now
 * .why = the entrance gate's predicate — it reads the stance corpus, the latest given per
 *        slug, and the levels a human forgave, then folds them through the pure
 *        `computeUndeclaredConcerns` (which is where every rule this gate encodes actually lives)
 */
export const getAllStoneUndeclaredConcerns = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<RouteGuardReviewPeerUndeclared[]> => {
  const [{ absorptions, givens }, overruledLevels] = await Promise.all([
    getStoneReviewCorpus({ route: input.route, stone: input.stone.name }),
    getStoneGuardOverruledLevels({ stone: input.stone, route: input.route }),
  ]);

  // the thresholds the judge tallies against, so this gate keys on the same verdict
  const thresholds = getReviewedJudgeThresholds({
    judges: input.stone.guard?.judges ?? [],
  });

  // the configured level per slug, so a forgiven level can be excluded
  const peerReviews = input.stone.guard
    ? getGuardPeerReviews(input.stone.guard)
    : [];
  const levelBySlug = asPeerReviewLevelBySlug({ peerReviews });

  return computeUndeclaredConcerns({
    absorptions,
    givens,
    levelBySlug,
    overruledLevels,
    allowBlockers: thresholds?.allowBlockers ?? 0,
    allowNitpicks: thresholds?.allowNitpicks ?? 0,
  });
};
