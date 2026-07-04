import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getStoneGuardOverruledLevels } from '../judges/getStoneGuardOverruledLevels';
import { computeStoneReviewInputHash } from './computeStoneReviewInputHash';
import {
  computeReviewActiveLevel,
  computeReviewTerminalLevel,
} from './reviewPeerMeter/computeReviewLevels';
import { getAllReviewPeerMeterStatuses } from './reviewPeerMeter/getAllReviewPeerMeterStatuses';

/**
 * .what = computes the level state of a stone's peer reviews
 * .why = overrule and force must scope to the active level, and force may only
 *        approve when the active level is the terminal level
 *
 * returns:
 * - hasLevels: whether the stone has peer reviews at all
 * - activeLevel: lowest unresolved level (null when all resolved)
 * - terminalLevel: highest level present (null when no reviewers)
 * - nextActiveLevel: the level that becomes active (ready) once the current
 *   active level is overruled (null when none would unlock — e.g. the active
 *   level is already terminal)
 */
export const getStoneReviewLevelState = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{
  hasLevels: boolean;
  activeLevel: number | null;
  terminalLevel: number | null;
  nextActiveLevel: number | null;
}> => {
  // no guard or no peer reviews = no levels to scope to
  const peerReviews = input.stone.guard
    ? getGuardPeerReviews(input.stone.guard)
    : [];
  if (peerReviews.length === 0) {
    return {
      hasLevels: false,
      activeLevel: null,
      terminalLevel: null,
      nextActiveLevel: null,
    };
  }

  // compute current peer verdicts for this stone's artifact content
  const hash = await computeStoneReviewInputHash({
    stone: input.stone,
    route: input.route,
  });
  const peerMeters = await getAllReviewPeerMeterStatuses({
    stone: input.stone,
    hash,
    route: input.route,
  });

  // load human overrules (levels already waved through)
  const { levels: overruledLevels } = await getStoneGuardOverruledLevels({
    stone: input.stone,
    route: input.route,
  });

  // compute active (lowest unresolved) and terminal (highest) levels
  const reviewers = peerMeters.map((m) => ({
    level: m.level,
    verdict: m.verdict,
  }));
  const activeLevel = computeReviewActiveLevel({ reviewers, overruledLevels });
  const terminalLevel = computeReviewTerminalLevel(reviewers);

  // compute the level that becomes ready once the active level is overruled
  // .why = overrule of the active level unlocks the next level; the human
  //        should see which level becomes ready to run
  const nextActiveLevel =
    activeLevel === null
      ? null
      : computeReviewActiveLevel({
          reviewers,
          overruledLevels: new Set([...overruledLevels, activeLevel]),
        });

  return {
    hasLevels: true,
    activeLevel,
    terminalLevel,
    nextActiveLevel,
  };
};
