import { computeResidualConcernCounts } from './computeResidualConcernCounts';

/**
 * .what = whether a dispute takes a lane out of THIS generation's round
 * .why = the two-part predicate — a stance stands AND the residual tally clears — was decoded
 *        inline at two call sites (`runStoneGuardReviews` and `getAllReviewPeerMeterStatuses`),
 *        each a re-decode of the same clamp + disjunction. one named transformer serves both, so
 *        the live skip and the persisted meter can never drift (rule.require.named-transformers).
 *
 * 🔴 a lane goes quiet ONLY when its residual clears the threshold. at 3 blockers with 1 disputed
 *    the residual still holds the road, so the lane speaks — a `disputed > 0` shortcut would paint
 *    a skip on a lane that ran (`case=4`'s F024).
 *
 * ⚠️ a lane that never spoke (no cachedReview) carries no counts and cannot be quiet — there is no
 *    prior verdict for a stance to answer.
 */
export const isLaneSkippedByDispute = (input: {
  cachedReview: { blockers: number; nitpicks: number } | null;
  disputed: { blockers: number; nitpicks: number };
  allowBlockers: number;
  allowNitpicks: number;
}): boolean => {
  if (!input.cachedReview) return false;

  const hasDispute = input.disputed.blockers > 0 || input.disputed.nitpicks > 0;
  if (!hasDispute) return false;

  // the per-lane skip sheds DISPUTES only — a concede keeps the lane in the round (it drives
  // another round to fix), so only the disputed counts subtract here. the judge's `better`-concede
  // shed is a stone-wide, terminality-time concern, never a per-round lane skip.
  const residual = computeResidualConcernCounts({
    totalBlockers: input.cachedReview.blockers,
    totalNitpicks: input.cachedReview.nitpicks,
    shedBlockers: input.disputed.blockers,
    shedNitpicks: input.disputed.nitpicks,
  });
  const holdsRoad =
    residual.blockers > input.allowBlockers ||
    residual.nitpicks > input.allowNitpicks;

  return !holdsRoad;
};
