import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import type { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import type { ReviewPeerVerdict } from './peer/meter/computeReviewPeerVerdict';
import { getOneReviewPeerVerdictOfPass } from './peer/meter/getOneReviewPeerVerdictOfPass';

/**
 * .what = every lane's verdict as this pass stands, each beside its slug and level
 * .why = the level-unlock gate reads all lanes' verdicts on a settled snapshot; one name
 *        states that read, so the orchestrator reads as a narrative
 *        (rule.forbid.decode-friction-in-orchestrators)
 * .note = reads `reviews` and `exhaustedSlugs` as they stand at the call, so the caller
 *         must call it after the level below has settled
 */
export const getAllReviewPeerVerdicts = (input: {
  peers: Array<{ index: number; slug: string; level: number; budget: number }>;
  meterBySlug: Map<string, RouteStoneGuardReviewPeerMeter>;
  reviews: RouteStoneGuardReviewArtifact[];
  cachedReviews: RouteStoneGuardReviewArtifact[];
  exhaustedSlugs: string[];
  allowBlockers: number;
  allowNitpicks: number;
}): Array<{ slug: string; level: number; verdict: ReviewPeerVerdict }> =>
  input.peers.map((pr) => ({
    slug: pr.slug,
    level: pr.level,
    verdict: getOneReviewPeerVerdictOfPass({
      lane: pr,
      rounds: input.meterBySlug.get(pr.slug)?.rounds ?? 0,
      reviews: input.reviews,
      cachedReviews: input.cachedReviews,
      exhaustedSlugs: input.exhaustedSlugs,
      allowBlockers: input.allowBlockers,
      allowNitpicks: input.allowNitpicks,
    }),
  }));
