import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { isReviewPeerVerdictTerminal } from './isReviewPeerLevelTerminal';

/**
 * .what = a reviewer input for the unlock decision
 * .why = the unlock decision needs budget state, not just the verdict, so it can
 *        tell a reviewer that can still improve from one that is frozen
 */
type ReviewPeerUnlockInput = {
  level: number;
  verdict: ReviewPeerVerdict;
  rounds: number;
  budget: number;
};

/**
 * .what = checks if a reviewer is settled — it can no longer change
 * .why = a level unlocks the next once its reviewers are settled; a reviewer is
 *        settled when its verdict is terminal (approved | exhausted) OR its
 *        budget is spent (rounds >= budget), because a spent reviewer cannot
 *        run again to improve — to block on it would deadlock the higher level
 * .note = fixes the deadlock where an l1 reviewer that rejected AND spent its
 *         last budget round stayed non-terminal forever, so l3 never unlocked
 */
const isReviewPeerSettled = (input: ReviewPeerUnlockInput): boolean =>
  isReviewPeerVerdictTerminal(input.verdict) || input.rounds >= input.budget;

/**
 * .what = checks if all reviewers at a level are settled
 * .why = a higher level runs only after every lower level is settled
 * .note = an empty level has no reviewers to block on, so it is settled
 */
const isReviewPeerLevelSettled = (input: {
  reviewers: ReviewPeerUnlockInput[];
  level: number;
}): boolean => {
  const atLevel = input.reviewers.filter((r) => r.level === input.level);
  if (atLevel.length === 0) return true;
  return atLevel.every(isReviewPeerSettled);
};

/**
 * .what = checks if a peer review level is unlocked to run
 * .why = a higher level runs only after EVERY lower level is settled; this is
 *        the gate that lets l3 run as soon as l1 clears — whether l1 approved,
 *        exhausted (skipped), or rejected with no budget left to retry
 * .note = level 1 has no lower levels, so it is always unlocked
 */
export const isReviewPeerLevelUnlocked = (input: {
  reviewers: ReviewPeerUnlockInput[];
  level: number;
}): boolean => {
  // every level strictly below the target must be settled
  for (let level = 1; level < input.level; level++) {
    if (!isReviewPeerLevelSettled({ reviewers: input.reviewers, level }))
      return false;
  }
  return true;
};
