import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = finds the 1-based index of a self-review by its slug
 * .why = extracts findIndex operation for narrative flow in orchestrators
 *
 * .note = returns 1-based index for file name conventions
 */
export const getSelfReviewIndex = (input: {
  selfReviews: RouteStoneGuardReviewSelf[];
  slug: string;
}): number => {
  const zeroBasedIndex = input.selfReviews.findIndex(
    (r) => r.slug === input.slug,
  );
  // convert to 1-based for file name conventions
  return zeroBasedIndex + 1;
};
