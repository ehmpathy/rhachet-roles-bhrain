import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import { getDisputeSkippedReviewerSlugs } from './getDisputeSkippedReviewerSlugs';
import { getExhaustedReviewerSlugs } from './getExhaustedReviewerSlugs';

/**
 * .what = the exhausted reviewer slugs that HALT passage — every exhausted lane, minus the lanes a
 *         dispute set aside and the levels a human forgave
 *
 * 🔴 .why the dispute subtraction = a DISPUTED lane drives on this generation (S15 —
 *    `define.invariant.review.peer.absorption.disputable-regardless-of-verdict`). the dispute is the
 *    driver's judgment that the lane is fine to continue, so its exhaustion must NOT halt the road
 *    — else a fully-disputed, exhausted lane blocks the very passage the dispute was meant to grant.
 *    it is excluded exactly as an overruled level is (a human's forgive), because both are levers
 *    already spent on the lane.
 *
 * 🔴 .why `skippedByDispute`, never a `disputed > 0` count = the subtraction reads the same flag the
 *    tree render does (getDisputeSkippedReviewerSlugs), which is true ONLY where the lane's residual
 *    no longer holds the road. a lane with one concern disputed and others live still RUNS, so it is
 *    NOT excluded — its exhaustion is real and still halts.
 */
export const getExhaustionHaltReviewerSlugs = (input: {
  meters: GuardPeerMeterStatus[];
  overruledLevels: Set<number>;
}): string[] => {
  const disputeSkipped = new Set(
    getDisputeSkippedReviewerSlugs({ meters: input.meters }),
  );
  return getExhaustedReviewerSlugs({
    meters: input.meters,
    overruledLevels: input.overruledLevels,
  }).filter((slug) => !disputeSkipped.has(slug));
};
