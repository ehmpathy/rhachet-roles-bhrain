import type { ReviewLane } from '@src/domain.operations/review/asReviewLane';

/**
 * .what = whether two lanes belong to the same reviewer — one root, one slug
 * .why = a reviewer outlives its prefix: a new head or brain is a new LANE of the same
 *        reviewer. `isSameReviewLane` asks the narrower question (all four parts); this
 *        asks the wider one, and a run with no lane belongs to no reviewer at all
 */
export const isSameReviewer = (input: {
  a: ReviewLane | null;
  b: ReviewLane | null;
}): boolean =>
  input.a !== null &&
  input.b !== null &&
  input.a.root === input.b.root &&
  input.a.slug === input.b.slug;
