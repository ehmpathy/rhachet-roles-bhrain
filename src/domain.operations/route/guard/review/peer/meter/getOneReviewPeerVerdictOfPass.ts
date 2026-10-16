import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { getOneCacheSafePeerReviewArtifact } from '../getOneCacheSafePeerReviewArtifact';
import { computeReviewPeerVerdict } from './computeReviewPeerVerdict';
import { isReviewPeerSkippedForBudget } from './isReviewPeerSkippedForBudget';

/**
 * .what = one lane's verdict as this pass stands — its fresh artifact if it ran, else its
 *         cache-safe prior artifact, folded with its meter and the judge thresholds
 * .why = the level-unlock gate reads every lane's verdict after each level settles; the
 *        derivation is one decision per lane, so it is named once rather than simulated
 *        inline in the orchestrator
 * .note = fresh reviews take precedence over cached ones. `reviews` is minted by the
 *         current guard list so its index is sound; only the cached side can cross a
 *         config change, so only it is guarded. `reviews` is not proof of what ran this
 *         pass — a member skipped for want of budget displays its own stale cache
 * .note = an absent artifact counts as infinite blockers, never zero (rule.forbid.failhide)
 */
export const getOneReviewPeerVerdictOfPass = (input: {
  lane: { index: number; slug: string; budget: number };
  rounds: number;
  reviews: RouteStoneGuardReviewArtifact[];
  cachedReviews: RouteStoneGuardReviewArtifact[];
  exhaustedSlugs: string[];
  allowBlockers: number;
  allowNitpicks: number;
}): ReturnType<typeof computeReviewPeerVerdict> => {
  // the artifact this lane minted this pass, else its cache-safe prior one
  const artifactThisPass = input.reviews.find(
    (r) => r.index === input.lane.index,
  );
  const cachedReview = getOneCacheSafePeerReviewArtifact({
    cachedReviews: input.cachedReviews,
    index: input.lane.index,
    slug: input.lane.slug,
  });
  const review = artifactThisPass ?? cachedReview;

  // this lane was skipped for want of budget, never merely spent-out
  const wasExhausted = isReviewPeerSkippedForBudget({
    slug: input.lane.slug,
    exhaustedSlugs: input.exhaustedSlugs,
    hasArtifactThisPass: !!artifactThisPass,
    rounds: input.rounds,
    budget: input.lane.budget,
  });

  // fold it all into the verdict
  return computeReviewPeerVerdict({
    rounds: input.rounds,
    budget: input.lane.budget,
    blockers: review?.blockers ?? Infinity,
    nitpicks: review?.nitpicks ?? 0,
    exitClass: review?.exitClass,
    allowBlockers: input.allowBlockers,
    allowNitpicks: input.allowNitpicks,
    wasExhausted,
  });
};
