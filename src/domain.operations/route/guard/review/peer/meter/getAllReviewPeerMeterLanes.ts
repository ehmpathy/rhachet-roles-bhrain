import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

import { getOneReviewPeerMeterLane } from './getOneReviewPeerMeterLane';

/**
 * .what = how many lane reads may be in flight at one time
 * .why = each lane read opens that lane's persisted review files. a guard holds about a
 *        dozen lanes, so this bound pours a typical stone in one or two waves, and keeps the
 *        open reads at a fixed count should a guard ever declare many more
 */
const BOUND_OF_CONCURRENT_LANE_READS = 8;

/**
 * .what = one lane's persisted meter state, paired with its reviewer
 * .why = names the per-lane read, so the gather reads as one named call per reviewer
 */
const getOneReviewPeerMeterLaneOfReviewer = async <
  TReviewer extends { index: number; slug: string; budget: number },
>(input: {
  reviewer: TReviewer;
  rounds: number;
  cachedReviews: RouteStoneGuardReviewArtifact[];
  stone: RouteStone;
  route: string;
  exhaustedReviewerSlugs: string[] | null;
  allowBlockers: number;
  allowNitpicks: number;
}) => {
  const lane = await getOneReviewPeerMeterLane(input);
  return { reviewer: input.reviewer, ...lane };
};

/**
 * .what = reads every lane's persisted meter state, each paired with its reviewer
 * .why = the meter orchestrator reads all lanes at once; one name states that act, so the
 *        orchestrator reads as a narrative rather than a map plus a spread to simulate
 *        (rule.forbid.decode-friction-in-orchestrators). the fan-out goes through the shared
 *        bounded pour, as every other gather of this subsystem does
 */
export const getAllReviewPeerMeterLanes = async <
  TReviewer extends { index: number; slug: string; budget: number },
>(input: {
  reviewers: TReviewer[];
  roundsBySlug: Map<string, number>;
  cachedReviews: RouteStoneGuardReviewArtifact[];
  stone: RouteStone;
  route: string;
  exhaustedReviewerSlugs: string[] | null;
  allowBlockers: number;
  allowNitpicks: number;
}) =>
  getAllResultsInBoundedPool({
    items: input.reviewers,
    bound: BOUND_OF_CONCURRENT_LANE_READS,
    map: (reviewer) =>
      getOneReviewPeerMeterLaneOfReviewer({
        reviewer,
        rounds: input.roundsBySlug.get(reviewer.slug) ?? 0,
        cachedReviews: input.cachedReviews,
        stone: input.stone,
        route: input.route,
        exhaustedReviewerSlugs: input.exhaustedReviewerSlugs,
        allowBlockers: input.allowBlockers,
        allowNitpicks: input.allowNitpicks,
      }),
  });
