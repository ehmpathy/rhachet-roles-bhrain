import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getSelfReviewIndex } from './getSelfReviewIndex';
import { isSelfReviewPromised } from './isSelfReviewPromised';

/**
 * .what = finds the next self-review that has not been promised
 * .why = provides named operation to find next review in sequence
 *
 * .note = `index` is 1-BASED — the review's position among the guard's declared reviews,
 *         which is what the `review.self N/M` line renders. it matches getSelfReviewIndex,
 *         whose contract is the same quantity under the same convention.
 * .why = it returned a zero-based indexOf until 2026-09-18, while setStoneAsPassed derived
 *        the same quantity as a one-based position. so the two emits a driver reads printed
 *        the SAME number for two DIFFERENT lanes — measured first-party: `has-pruned-yagni`
 *        (position 1) and `has-pruned-backcompat` (position 2) both rendered `1/8`.
 *        a counter that does not advance reads as a guard that lost the promise.
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
  // .note = the predicate is the shared one — setStoneAsPassed filters the same array with
  //         it and then trusts this finder to pick from that same set. bound to one source,
  //         the two cannot disagree; hand-typed, they only happened to
  const nextUnpromised = selfReviews.find(
    (review) => !isSelfReviewPromised({ review, promisedSlugs }),
  );

  if (!nextUnpromised) return null;

  return {
    reviewSelf: nextUnpromised,
    // 🔴 the position comes from the one operation that owns it, never from a local `+ 1`.
    //    this read `selfReviews.indexOf(nextUnpromised) + 1` until 2026-09-20 — a fourth
    //    hand-typed derivation of the quantity whose three prior copies are the defect this
    //    whole round was named for. the two OPERATIONS still answer different questions (see
    //    getSelfReviewIndex's docblock); what they no longer do is each convert to 1-based.
    index: getSelfReviewIndex({ selfReviews, slug: nextUnpromised.slug }),
    total,
  };
};
