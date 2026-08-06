import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { isLevelOverruled } from './isLevelOverruled';

/**
 * .what = the slugs of the peer reviewers whose level was overruled
 * .why = an overruled level's reviewers are forgiven — their critique needs no contemplation
 *        .taken and their blockers do not gate passage; callers read this slug set to skip them.
 * .note = a review's level defaults to 1 when unset, to match the 1-based level convention of
 *         getReviewLevelByIndex and getStoneGuardLevelClearance. the per-level check reads the
 *         shared isLevelOverruled primitive, so "is this level overruled" is decided in one place.
 */
export const getOverruledReviewerSlugs = (input: {
  peerReviews: RouteStoneGuardReviewPeer[];
  overruledLevels: Set<number>;
}): string[] =>
  input.peerReviews
    .filter((review) =>
      isLevelOverruled({
        level: review.level ?? 1,
        overruledLevels: input.overruledLevels,
      }),
    )
    .map((review) => review.slug);
