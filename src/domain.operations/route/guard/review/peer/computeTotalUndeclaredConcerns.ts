import type { RouteGuardReviewPeerUndeclared } from './getStoneUndeclaredConcerns';

/**
 * .what = the total count of concerns still owed a stance, summed across every lane
 * .why = the stance prompt and the entrance gate each need this one number, and both had folded
 *        it inline with `lanes.reduce((sum, lane) => sum + lane.concerns.length, 0)`. two copies
 *        of a fold are two places a reader must simulate the sum, and a third caller could drift
 *        it (rule.forbid.inline-decode-friction). one named transformer, so the orchestrators
 *        read as narrative.
 */
export const computeTotalUndeclaredConcerns = (input: {
  lanes: RouteGuardReviewPeerUndeclared[];
}): number => input.lanes.reduce((sum, lane) => sum + lane.concerns.length, 0);
