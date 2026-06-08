import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import type { GuardPeerMeterStatus } from '../formatGuardTree';
import { getAllStoneGuardArtifactsByHash } from '../getAllStoneGuardArtifactsByHash';
import { computeReviewPeerVerdict } from './computeReviewPeerVerdict';
import { getAllRouteStoneGuardReviewPeerMeters } from './getAllRouteStoneGuardReviewPeerMeters';
import { isReviewPeerLevelTerminal } from './isReviewPeerLevelTerminal';

/**
 * .what = computes full peer meter status for all reviewers
 * .why = enables display of reviewer budget/level/verdict in output
 */
export const getAllReviewPeerMeterStatuses = async (input: {
  stone: RouteStone;
  hash: string;
  route: string;
}): Promise<GuardPeerMeterStatus[]> => {
  // check if stone has a guard
  if (!input.stone.guard) return [];

  // get all peer reviews from guard
  const peerReviews = getGuardPeerReviews(input.stone.guard);
  if (peerReviews.length === 0) return [];

  // load current meters for rounds consumed (per stone)
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone.name,
  });
  const meterBySlug = new Map<string, { rounds: number }>();
  for (const meter of meters) {
    meterBySlug.set(meter.reviewer.slug, { rounds: meter.rounds });
  }

  // load cached reviews to get blockers
  const priorArtifacts = await getAllStoneGuardArtifactsByHash({
    stone: input.stone,
    hash: input.hash,
    route: input.route,
  });
  const cachedReviews = priorArtifacts.reviews.filter(
    (r) => r.exitClass === 'passed',
  );

  // extract reviewer info from structured reviews
  const reviewersWithIndex = peerReviews.map((review, i) => ({
    index: i + 1,
    slug: review.slug,
    level: review.level ?? 1,
    budget: review.budget,
  }));

  // compute verdict for each reviewer
  const statuses: GuardPeerMeterStatus[] = [];
  for (const reviewer of reviewersWithIndex) {
    const meter = meterBySlug.get(reviewer.slug);
    const rounds = meter?.rounds ?? 0;
    const cachedReview = cachedReviews.find((r) => r.index === reviewer.index);
    const blockers = cachedReview?.blockers ?? Infinity;

    const verdict = computeReviewPeerVerdict({
      rounds,
      budget: reviewer.budget,
      blockers,
    });

    // compute if this reviewer awaits lower level
    let awaits: { level: number } | false = false;
    if (reviewer.level > 1) {
      // check if any lower level is not terminal
      const verdicts = reviewersWithIndex.map((r) => ({
        slug: r.slug,
        level: r.level,
        verdict: computeReviewPeerVerdict({
          rounds: meterBySlug.get(r.slug)?.rounds ?? 0,
          budget: r.budget,
          blockers:
            cachedReviews.find((cr) => cr.index === r.index)?.blockers ??
            Infinity,
        }),
      }));
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
    });
  }

  // sort by level (low-to-high = cheapest first) for consistent display
  statuses.sort((a, b) => a.level - b.level);

  return statuses;
};
