import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = maps each peer review's 1-based index to its level
 * .why = several passage/unlock sites need "which level does review index N belong to"
 *        to forgive or gate a level; this transformer is the single source for that map,
 *        so the `index + 1 -> level ?? 1` derivation is not copy-pasted per call site
 *        (it drifted before — see the level-clearance re-derivation the guard consolidates).
 *
 * .note = index is 1-based to match the `.rN.` review-file / meter convention.
 */
export const getReviewLevelByIndex = (input: {
  peerReviews: RouteStoneGuardReviewPeer[];
}): Map<number, number> =>
  new Map(input.peerReviews.map((review, i) => [i + 1, review.level ?? 1]));
