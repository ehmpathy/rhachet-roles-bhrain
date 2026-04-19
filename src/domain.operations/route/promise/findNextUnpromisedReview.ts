import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = finds the next self-review that has not been promised
 * .why = provides named operation to find next review in sequence
 */
export const findNextUnpromisedReview = (input: {
  selfReviews: RouteStoneGuardReviewSelf[];
  promisedSlugs: Set<string>;
}): {
  reviewSelf: RouteStoneGuardReviewSelf;
  index: number;
  total: number;
} | null => {
  const { selfReviews, promisedSlugs } = input;
  const total = selfReviews.length;

  // find first unpromised review
  const nextUnpromised = selfReviews.find((r) => !promisedSlugs.has(r.slug));

  if (!nextUnpromised) return null;

  return {
    reviewSelf: nextUnpromised,
    index: selfReviews.indexOf(nextUnpromised),
    total,
  };
};
