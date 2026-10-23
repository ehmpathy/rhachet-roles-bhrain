import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = the guard's peer reviewers, each with its declared position, sorted by level
 * .why = the walk pours the cheapest level first, and every lane is addressed by its
 *        DECLARED position (the cache key, the `rN` in an artifact name). this names both
 *        facts once, so the orchestrator reads them as a value rather than a pipeline
 * .note = `index` is 1-based and `arrayIndex` 0-based, both of the declared order. the
 *         sort is stable, so lanes that share a level keep their declared order
 */
export const getAllReviewPeersByLevel = (input: {
  peerReviews: RouteStoneGuardReviewPeer[];
}): {
  review: RouteStoneGuardReviewPeer;
  index: number;
  arrayIndex: number;
  slug: string;
  level: number;
  budget: number;
}[] => {
  // each reviewer with its declared position, before any reorder
  const declared = input.peerReviews.map((review, arrayIndex) => ({
    review,
    index: arrayIndex + 1,
    arrayIndex,
    slug: review.slug,
    level: review.level,
    budget: review.budget,
  }));

  // cheapest level first, on a copy, so the sort never reorders a list it was handed
  return [...declared].sort((a, b) => a.level - b.level);
};
