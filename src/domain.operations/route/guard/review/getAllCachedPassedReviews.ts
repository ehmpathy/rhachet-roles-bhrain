import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

/**
 * .what = the prior review artifacts eligible for reuse — those whose run passed
 * .why = only a successful review is cached. a malfunction may mean the reviewer was fixed;
 *        a constraint may mean the artifact was fixed — both need a re-run
 */
export const getAllCachedPassedReviews = (input: {
  reviews: RouteStoneGuardReviewArtifact[];
}): RouteStoneGuardReviewArtifact[] =>
  input.reviews.filter((r) => r.exitClass === 'passed');
