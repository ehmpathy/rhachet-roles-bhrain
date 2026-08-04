import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { getStoneGuardLevelClearance } from './getStoneGuardLevelClearance';

/**
 * .what = true when EVERY review level is terminal — no level will produce more reviews. a level
 *         is terminal when the human overruled it, OR every reviewer at it is terminal-for-unlock
 *         (approved | exhausted | malfunction | constraint).
 * .why = the "all reviewers are done, only human approval / the judge remains" gate. it decides
 *        whether the exhaustion halt fires and whether the exhaustion+approval bypass may run.
 *
 *        the trap it closes: an overruled reviewer's RAW verdict stays 'rejected' (overrule is a
 *        separate forgiveness flag, not a verdict — see getAllReviewPeerMeterStatuses). a bare
 *        `every(isReviewPeerVerdictTerminal(verdict))` therefore reads an overruled level as
 *        non-terminal, which skips the exhaustion halt and lets an exhausted HIGHER level pass
 *        WITHOUT the human approval the invariant requires — the overrule spills upward. to read
 *        the shared clearance's `clearForUnlock` (overrule-aware) is the single-sourced fix.
 *
 * .note = false when there are no reviewers — the gates that consume this only care about a ladder
 *         that actually has levels; an empty ladder is handled by their own `length > 0` guard.
 */
export const isEveryReviewLevelTerminal = (input: {
  reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }>;
  overruledLevels: Set<number>;
}): boolean => {
  if (input.reviewers.length === 0) return false;
  const clearance = getStoneGuardLevelClearance({
    reviewers: input.reviewers,
    overruledLevels: input.overruledLevels,
  });
  return clearance.every((level) => level.clearForUnlock);
};
