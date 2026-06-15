import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import type { GuardPeerMeterStatus } from '../formatGuardTree';
import { getAllStoneGuardArtifactsByHash } from '../getAllStoneGuardArtifactsByHash';
import { getLatestReviewArtifactForIndex } from '../getLatestReviewArtifactForIndex';
import { computeReviewPeerVerdict } from './computeReviewPeerVerdict';
import { getAllRouteStoneGuardReviewPeerMeters } from './getAllRouteStoneGuardReviewPeerMeters';
import { getReviewedJudgeThresholds } from './getReviewedJudgeThresholds';
import { isReviewPeerLevelTerminal } from './isReviewPeerLevelTerminal';

/**
 * .what = computes full peer meter status for all reviewers
 * .why = enables display of reviewer budget/level/verdict in output
 */
export const getAllReviewPeerMeterStatuses = async (input: {
  stone: RouteStone;
  hash: string;
  route: string;
  exhaustedReviewerSlugs?: string[];
}): Promise<GuardPeerMeterStatus[]> => {
  // check if stone has a guard
  if (!input.stone.guard) return [];

  // get all peer reviews from guard
  const peerReviews = getGuardPeerReviews(input.stone.guard);
  if (peerReviews.length === 0) return [];

  // convert skipped slugs to set for O(1) lookup
  const exhaustedSet = new Set(input.exhaustedReviewerSlugs ?? []);

  // load current meters for rounds consumed (per stone)
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone.name,
  });
  const meterBySlug = new Map<string, { rounds: number }>();
  for (const meter of meters) {
    meterBySlug.set(meter.reviewer.slug, { rounds: meter.rounds });
  }

  // load cached reviews to get blockers (include ALL reviews, not just passed)
  const priorArtifacts = await getAllStoneGuardArtifactsByHash({
    stone: input.stone,
    hash: input.hash,
    route: input.route,
  });
  const cachedReviews = priorArtifacts.reviews;

  // extract reviewer info from structured reviews
  const reviewersWithIndex = peerReviews.map((review, i) => ({
    index: i + 1,
    slug: review.slug,
    level: review.level ?? 1,
    budget: review.budget,
  }));

  // get thresholds from guard's reviewed? judge (same thresholds for all reviewers)
  const thresholds = getReviewedJudgeThresholds({
    judges: input.stone.guard.judges,
  });
  const allowBlockers = thresholds?.allowBlockers ?? 0;
  const allowNitpicks = thresholds?.allowNitpicks ?? 0;

  // pre-compute reviews for all reviewers (fallback to latest for exhausted)
  // track both review data and whether it's for current hash (to detect skipped)
  const reviewByIndex = new Map<
    number,
    {
      review: {
        blockers: number;
        nitpicks: number;
        path: string;
        exitClass: 'passed' | 'constraint' | 'malfunction';
      } | null;
      hasReviewForCurrentHash: boolean;
    }
  >();
  for (const reviewer of reviewersWithIndex) {
    const rounds = meterBySlug.get(reviewer.slug)?.rounds ?? 0;

    // first try current hash, then fallback to latest review (for exhausted reviewers)
    const reviewForCurrentHash = cachedReviews.find(
      (r) => r.index === reviewer.index,
    );
    let review = reviewForCurrentHash;
    if (!review && rounds > 0) {
      // reviewer has rounds but no review for current hash = likely exhausted
      // find their latest review regardless of hash
      review =
        (await getLatestReviewArtifactForIndex({
          stone: input.stone,
          index: reviewer.index,
          route: input.route,
        })) ?? undefined;
    }
    reviewByIndex.set(reviewer.index, {
      review: review ?? null,
      hasReviewForCurrentHash: !!reviewForCurrentHash,
    });
  }

  // compute verdict for each reviewer
  const statuses: GuardPeerMeterStatus[] = [];
  for (const reviewer of reviewersWithIndex) {
    const meter = meterBySlug.get(reviewer.slug);
    const rounds = meter?.rounds ?? 0;
    const reviewEntry = reviewByIndex.get(reviewer.index);
    const cachedReview = reviewEntry?.review ?? null;
    const hasReviewForCurrentHash =
      reviewEntry?.hasReviewForCurrentHash ?? false;

    const blockers = cachedReview?.blockers ?? Infinity;
    const nitpicks = cachedReview?.nitpicks ?? 0;

    // wasExhausted = reviewer was skipped in THIS iteration due to exhaustion
    // .why = if exhaustedReviewerSlugs was passed, use it (authoritative from runStoneGuardReviews)
    //        otherwise fall back to heuristic: no review for hash AND rounds >= budget
    // .invariant = a review can only be 'exhausted' if it was SKIPPED (see define.invariant.review.peer.exhausted)
    const wasExhausted =
      input.exhaustedReviewerSlugs !== undefined
        ? exhaustedSet.has(reviewer.slug)
        : !hasReviewForCurrentHash && rounds >= reviewer.budget;

    const verdict = computeReviewPeerVerdict({
      rounds,
      budget: reviewer.budget,
      blockers,
      nitpicks,
      allowBlockers,
      allowNitpicks,
      exitClass: cachedReview?.exitClass,
      wasExhausted,
    });

    // compute if this reviewer awaits lower level
    let awaits: { level: number } | false = false;
    if (reviewer.level > 1) {
      // check if any lower level is not terminal
      const verdicts = reviewersWithIndex.map((r) => {
        const entry = reviewByIndex.get(r.index);
        const cr = entry?.review ?? null;
        const rRounds = meterBySlug.get(r.slug)?.rounds ?? 0;
        const rHasReviewForCurrentHash =
          entry?.hasReviewForCurrentHash ?? false;
        const rWasSkipped =
          input.exhaustedReviewerSlugs !== undefined
            ? exhaustedSet.has(r.slug)
            : !rHasReviewForCurrentHash && rRounds >= r.budget;
        return {
          slug: r.slug,
          level: r.level,
          verdict: computeReviewPeerVerdict({
            rounds: rRounds,
            budget: r.budget,
            blockers: cr?.blockers ?? Infinity,
            nitpicks: cr?.nitpicks ?? 0,
            allowBlockers,
            allowNitpicks,
            exitClass: cr?.exitClass,
            wasExhausted: rWasSkipped,
          }),
        };
      });
      for (let level = 1; level < reviewer.level; level++) {
        if (!isReviewPeerLevelTerminal({ reviewers: verdicts, level })) {
          awaits = { level };
          break;
        }
      }
    }

    statuses.push({
      slug: reviewer.slug,
      level: reviewer.level,
      rounds,
      budget: reviewer.budget,
      verdict,
      awaits,
      blockers: cachedReview?.blockers ?? 0,
      nitpicks: cachedReview?.nitpicks ?? 0,
      path: cachedReview?.path ?? null,
    });
  }

  // sort by level (low-to-high = cheapest first) for consistent display
  statuses.sort((a, b) => a.level - b.level);

  return statuses;
};
