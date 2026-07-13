import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = extracts slugs from self-review definitions
 * .why = provides named operation for slug enumeration
 */
export const getSelfReviewSlugs = (input: {
  selfReviews: RouteStoneGuardReviewSelf[];
}): string[] => {
  return input.selfReviews.map((r) => r.slug);
};
