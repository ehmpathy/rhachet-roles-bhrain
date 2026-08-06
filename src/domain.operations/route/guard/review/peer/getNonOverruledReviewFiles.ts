import * as path from 'path';

import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getReviewLevelByIndex } from './meter/getReviewLevelByIndex';

/**
 * .what = keeps only the review files whose level was NOT overruled by a human
 * .why = the reviewed? judge tallies blockers across review files, but a level the human
 *        overruled is forgiven — its blockers must not gate passage. this transformer names
 *        that filter so the judge orchestrator reads as narrative, not an inline regex+lookup
 *        (rule.forbid.inline-decode-friction).
 *
 * a review file is named `...rN...` where N is the reviewer's 1-based index; the index maps to a
 * level via the peer-review declaration order (getReviewLevelByIndex). a file whose level sits in
 * overruledLevels is dropped.
 *
 * .note = a filename with no `.rN.` marker falls back to index 0 -> level 1, to match the prior
 *         inline behavior (a level-1 file is kept unless level 1 itself was overruled).
 */
export const getNonOverruledReviewFiles = (input: {
  reviewFiles: string[];
  peerReviews: RouteStoneGuardReviewPeer[];
  overruledLevels: Set<number>;
}): string[] => {
  const levelByReviewIndex = getReviewLevelByIndex({
    peerReviews: input.peerReviews,
  });
  return input.reviewFiles.filter((filePath) => {
    const indexMatch = path.basename(filePath).match(/\.r(\d+)\./);
    const reviewIndex = indexMatch?.[1] ? parseInt(indexMatch[1], 10) : 0;
    const reviewLevel = levelByReviewIndex.get(reviewIndex) ?? 1;
    return !input.overruledLevels.has(reviewLevel);
  });
};
