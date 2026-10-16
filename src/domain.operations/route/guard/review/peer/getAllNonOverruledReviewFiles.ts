import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asReviewIndexFromPath } from './asReviewIndexFromPath';
import { getAllReviewLevelsByIndex } from './meter/getAllReviewLevelsByIndex';
import { getOneReviewLevelByIndex } from './meter/getOneReviewLevelByIndex';

/**
 * .what = keeps only the review files whose level was NOT overruled by a human
 * .why = the reviewed? judge tallies blockers across review files, but a level the human
 *        overruled is forgiven — its blockers must not gate passage. this transformer names
 *        that filter so the judge orchestrator reads as narrative, not an inline regex+lookup
 *        (rule.forbid.inline-decode-friction).
 *
 * a review file is named `...rN...` where N is the reviewer's 1-based index; the index maps to a
 * level via the peer-review declaration order (getAllReviewLevelsByIndex). a file whose level sits in
 * overruledLevels is dropped.
 *
 * .note = a filename with no `.rN.` marker falls back to index 0 -> level 1, to match the prior
 *         inline behavior (a level-1 file is kept unless level 1 itself was overruled).
 */
export const getAllNonOverruledReviewFiles = (input: {
  reviewFiles: string[];
  peerReviews: RouteStoneGuardReviewPeer[];
  overruledLevels: Set<number>;
}): string[] => {
  const levelByReviewIndex = getAllReviewLevelsByIndex({
    peerReviews: input.peerReviews,
  });
  return input.reviewFiles.filter((filePath) => {
    const reviewLevel = getOneReviewLevelByIndex({
      levels: levelByReviewIndex,
      index: asReviewIndexFromPath({ path: filePath }),
    });
    return !input.overruledLevels.has(reviewLevel);
  });
};
