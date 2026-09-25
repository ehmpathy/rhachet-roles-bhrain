import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

import { isSelfReviewPromised } from './isSelfReviewPromised';

/**
 * .what = counts how many self-reviews have been promised
 * .why = provides named operation for progress calculation
 *
 * .note = the predicate is the shared one, never a local `.has(r.slug)` — this count and
 *         the two "still owed" scans are one domain fact read two ways, so they must read
 *         it from one place (isSelfReviewPromised)
 */
export const computePromisedReviewCount = (input: {
  selfReviews: RouteStoneGuardReviewSelf[];
  promisedSlugs: Set<string>;
}): number =>
  input.selfReviews.filter((review) =>
    isSelfReviewPromised({ review, promisedSlugs: input.promisedSlugs }),
  ).length;
