import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getStoneGuardLevelsPoured } from '../../../../judges/getStoneGuardLevelsPoured';
import { getAllStoneGuardArtifactsByHash } from '../../../artifact/getAllStoneGuardArtifactsByHash';
import { getRepoRootWithFallback } from '../../../getRepoRootWithFallback';
import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import { getAllReviewPeersByLevel } from '../../getAllReviewPeersByLevel';
import { getStoneReviewCorpus } from '../getStoneReviewCorpus';
import { asClearanceByLevel } from './asClearanceByLevel';
import { asReviewPeerMeterStatus } from './asReviewPeerMeterStatus';
import { asRoundsBySlug } from './asRoundsBySlug';
import { getAllReviewPeerMeterLanes } from './getAllReviewPeerMeterLanes';
import { getAllRouteStoneGuardReviewPeerMeters } from './getAllRouteStoneGuardReviewPeerMeters';
import { getReviewedJudgeThresholds } from './getReviewedJudgeThresholds';
import { isLevelOverruled } from './isLevelOverruled';

/**
 * .what = computes full peer meter status for all reviewers
 * .why = enables display of reviewer budget/level/verdict in output
 */
export const getAllReviewPeerMeterStatuses = async (input: {
  stone: RouteStone;
  hash: string;
  route: string;
  /**
   * the authoritative list of reviewer slugs skipped-by-exhaustion this iteration (from
   * runStoneGuardReviews), or `null` when the caller has no authoritative list and the heuristic
   * (`no review for hash AND rounds >= budget`) should decide instead.
   * .why = null and [] differ — `null` = "no authoritative list, use the heuristic"; `[]` =
   *        "authoritative: none was exhausted". modeled as `string[] | null` (not optional) so the
   *        two cases are explicit at compile time (rule.forbid.undefined-inputs).
   */
  exhaustedReviewerSlugs: string[] | null;
  /**
   * levels the human has overruled (waved through). an overruled level is terminal-for-unlock
   * and clear-for-passage, so a HIGHER level must NOT show `awaits l<overruled> terminal`, and
   * the level itself is stamped `overruled` for the display consumers. required — an empty set is
   * the explicit "none overruled" value (rule.forbid.undefined-inputs).
   * .why = overrule is a separate forgiveness flag, not a verdict — the raw verdict of an
   *        overruled reviewer stays 'rejected'. without this, the awaits calc reads that raw
   *        verdict as non-terminal and paints a false `awaits` line on the level above it.
   */
  overruledLevels: Set<number>;
}): Promise<GuardPeerMeterStatus[]> => {
  // check if stone has a guard
  if (!input.stone.guard) return [];

  // get all peer reviews from guard
  const peerReviews = getGuardPeerReviews(input.stone.guard);
  if (peerReviews.length === 0) return [];

  // the lanes, cheapest level first, each with its declared position
  // .why = the display reads low-to-high; the sort is stable, so a level's lanes keep their order
  const reviewers = getAllReviewPeersByLevel({ peerReviews });

  // load current meters for rounds consumed (per stone)
  // .note = slugs are guaranteed unique at parse time via standardizePeerReviewSlugs
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone.name,
  });
  const meterBySlug = asRoundsBySlug({ meters });

  // load cached reviews to get blockers (include ALL reviews, not just passed)
  const priorArtifacts = await getAllStoneGuardArtifactsByHash({
    stone: input.stone,
    hash: input.hash,
    route: input.route,
  });

  // get thresholds from guard's reviewed? judge (same thresholds for all reviewers)
  const thresholds = getReviewedJudgeThresholds({
    judges: input.stone.guard.judges,
  });
  const allowBlockers = thresholds?.allowBlockers ?? 0;
  const allowNitpicks = thresholds?.allowNitpicks ?? 0;

  // read each lane's meter state ONCE. both the clearance calc (for the awaits line) and the
  // status render below read from it — so a lane's shown verdict can never drift from the
  // verdict its level-clearance was judged on (rule.require.single-source-of-truth-for-render)
  const lanes = await getAllReviewPeerMeterLanes({
    reviewers,
    roundsBySlug: meterBySlug,
    cachedReviews: priorArtifacts.reviews,
    stone: input.stone,
    route: input.route,
    exhaustedReviewerSlugs: input.exhaustedReviewerSlugs,
    allowBlockers,
    allowNitpicks,
  });

  // the shared clearance primitive decides which lower levels are clear-for-unlock. an
  // overruled lower level is clear (the human waved it) — the SAME forgiveness the unlock filter
  // and judge apply, read from one source so the `awaits` line cannot drift from them.
  const clearanceByLevel = asClearanceByLevel({
    lanes,
    overruledLevels: input.overruledLevels,
  });

  // the stance corpus, read once for every lane — the per-lane fold is pure and cheap.
  // .why = the same read `runStoneGuardReviews` makes for the live path, through the same
  //        communicator, so the persisted path folds the same corpus rather than a second
  //        predicate that could drift (rule.require.single-source-of-truth-for-render).
  const corpus = await getStoneReviewCorpus({
    route: input.route,
    stone: input.stone.name,
  });

  // the level-unlock LATCH, read HERE rather than taken as an input
  // .why = this operation has four callers (setStoneAsPassed, getCurrentExhaustedSlugs,
  //        getOneStoneGuardLevelState, getStoneGuardExhaustedApprovalBypass). an input
  //        would be four chances to forget it, and the one that forgot would render an
  //        `awaits` the runner disagrees with — the exact drift measured 2026-09-16.
  //        it needs only `stone` and `route`, both already in hand, so the read is
  //        cheap and the render cannot drift from the gate by construction
  //        (define.invariant.review.peer.level-unlock-is-a-latch)
  const levelsPoured = await getStoneGuardLevelsPoured({
    stone: input.stone,
    route: input.route,
  });

  // the root every printed artifact path is rendered against, read once — it shells out to git
  const rootDisplay = await getRepoRootWithFallback({ from: input.route });

  // one status per lane, already in level order
  return lanes.map((lane) =>
    asReviewPeerMeterStatus({
      reviewer: lane.reviewer,
      lane,
      levelsPoured,
      clearanceByLevel,
      corpus,
      allowBlockers,
      allowNitpicks,
      overruled: isLevelOverruled({
        level: lane.reviewer.level,
        overruledLevels: input.overruledLevels,
      }),
      rootDisplay,
    }),
  );
};
