import type { ReviewLane } from './asReviewLane';
import { asReviewLaneKey } from './asReviewLaneKey';

/**
 * .what = whether two lanes are the same lane
 * .why = the root, the slug, the head, AND the brain must match, and a run with no lane is in no
 *        lane at all — so it can never pair with another by accident
 */
export const isSameReviewLane = (input: {
  a: ReviewLane | null;
  b: ReviewLane | null;
}): boolean =>
  input.a !== null &&
  input.b !== null &&
  asReviewLaneKey({ lane: input.a }) === asReviewLaneKey({ lane: input.b });
