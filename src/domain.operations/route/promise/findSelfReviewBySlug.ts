import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = finds a self-review by its slug
 * .why = extracts find operation for narrative flow in orchestrators
 */
export const findSelfReviewBySlug = (input: {
  selfReviews: RouteStoneGuardReviewSelf[];
  slug: string;
}): RouteStoneGuardReviewSelf | undefined => {
  return input.selfReviews.find((r) => r.slug === input.slug);
};
