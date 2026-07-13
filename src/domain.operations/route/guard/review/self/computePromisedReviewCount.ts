import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = counts how many self-reviews have been promised
 * .why = provides named operation for progress calculation
 */
export const computePromisedReviewCount = (input: {
  selfReviews: RouteStoneGuardReviewSelf[];
  promisedSlugs: Set<string>;
}): number => {
  return input.selfReviews.filter((r) => input.promisedSlugs.has(r.slug))
    .length;
};
