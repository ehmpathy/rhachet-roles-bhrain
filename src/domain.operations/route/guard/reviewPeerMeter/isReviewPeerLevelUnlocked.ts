import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { isReviewPeerLevelTerminal } from './isReviewPeerLevelTerminal';

/**
 * .what = checks if a peer review level is unlocked to run
 * .why = a higher level runs only after EVERY lower level is terminal
 *        (approved | exhausted); this is the gate that lets l3 run as soon
 *        as l1 clears — whether l1 approved or spent its budget and got skipped
 * .note = level 1 has no lower levels, so it is always unlocked
 * .note = a rejected reviewer that still has (or just spent) budget is NOT
 *         terminal; the driver is expected to fix + retry (or exhaust it via a
 *         skip), per define.invariant.review.peer.exhausted. only a SKIPPED
 *         review is 'exhausted' → terminal → unlocks the next level
 */
export const isReviewPeerLevelUnlocked = (input: {
  reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }>;
  level: number;
}): boolean => {
  // every level strictly below the target must be terminal
  for (let level = 1; level < input.level; level++) {
    if (!isReviewPeerLevelTerminal({ reviewers: input.reviewers, level }))
      return false;
  }
  return true;
};
