import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { getOneCacheSafePeerReviewArtifact } from '../getOneCacheSafePeerReviewArtifact';
import { getOneLatestReviewArtifactForSlug } from '../getOneLatestReviewArtifactForSlug';
import {
  computeReviewPeerVerdict,
  type ReviewPeerVerdict,
} from './computeReviewPeerVerdict';
import { isReviewPeerSkippedForBudget } from './isReviewPeerSkippedForBudget';

/**
 * .what = one lane's persisted meter state — the review it is judged on, its rounds, and
 *         its verdict — read once so the clearance calc and the status render share it
 * .why = the persisted path (a halt tree, a `route.drive` render) must reach the verdict the
 *        live runner reached, and must compute it ONCE per lane so the shown verdict can never
 *        drift from the verdict its level-clearance was judged on
 *        (rule.require.single-source-of-truth-for-render)
 */
export const getOneReviewPeerMeterLane = async (input: {
  reviewer: { index: number; slug: string; budget: number };
  rounds: number;
  cachedReviews: RouteStoneGuardReviewArtifact[];
  stone: RouteStone;
  route: string;
  /** authoritative skipped-by-exhaustion slugs, or null to fall back to the heuristic */
  exhaustedReviewerSlugs: string[] | null;
  allowBlockers: number;
  allowNitpicks: number;
}): Promise<{
  cachedReview: RouteStoneGuardReviewArtifact | null;
  rounds: number;
  verdict: ReviewPeerVerdict;
}> => {
  // the review at this hash, but only when THIS lane minted it
  // .note = the cache is keyed by position, so a rung whose tenant changed must not reuse it —
  //         the guard confirms the slug and returns null on a mismatch, which drops this lane
  //         to the slug-keyed fallback below (or to "never spoke", when rounds = 0). an
  //         unguarded read here would unlock a level on a verdict the current lane never gave.
  //         a structural cure would key the cache on the slug itself; tracked as
  //         .dream/v2026_09_05.fix.guard-review-cache-is-keyed-by-index-not-slug.md
  const reviewForCurrentHash = getOneCacheSafePeerReviewArtifact({
    cachedReviews: input.cachedReviews,
    index: input.reviewer.index,
    slug: input.reviewer.slug,
  });

  // a lane with rounds but no review at this hash is likely exhausted; read its latest review
  // .note = keyed by slug, never by index — this reach crosses hashes, so it can straddle a
  //         config change in which a retired lane's rung was reused by its successor
  const fallbackReview =
    !reviewForCurrentHash && input.rounds > 0
      ? await getOneLatestReviewArtifactForSlug({
          stone: input.stone,
          index: input.reviewer.index,
          slug: input.reviewer.slug,
          route: input.route,
        })
      : null;
  const cachedReview = reviewForCurrentHash ?? fallbackReview ?? null;

  // wasExhausted = this lane was skipped THIS iteration for want of budget
  // .why = one named claim, shared with getOneReviewPeerVerdictOfPass, so the exhaustion rule
  //        has one home. the judge runs as its own process with no authoritative list, so a
  //        null list reads as empty and the hash carries the skipped half via the floor
  //        (define.invariant.review.peer.exhausted)
  const wasExhausted = isReviewPeerSkippedForBudget({
    slug: input.reviewer.slug,
    exhaustedSlugs: input.exhaustedReviewerSlugs ?? [],
    hasArtifactThisPass: reviewForCurrentHash !== null,
    rounds: input.rounds,
    budget: input.reviewer.budget,
  });

  // fold it into the verdict
  const verdict = computeReviewPeerVerdict({
    rounds: input.rounds,
    budget: input.reviewer.budget,
    blockers: cachedReview?.blockers ?? Infinity,
    nitpicks: cachedReview?.nitpicks ?? 0,
    allowBlockers: input.allowBlockers,
    allowNitpicks: input.allowNitpicks,
    exitClass: cachedReview?.exitClass,
    wasExhausted,
  });
  return { cachedReview, rounds: input.rounds, verdict };
};
