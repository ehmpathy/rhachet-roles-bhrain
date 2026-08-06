import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getStoneGuardOverruledLevels } from '../../judges/getStoneGuardOverruledLevels';
import { getStoneGuardJudgeVerdicts } from '../judge/getStoneGuardJudgeVerdicts';
import { isJudgeRungHeld } from '../judge/isJudgeRungHeld';
import { computeStoneReviewInputHash } from './computeStoneReviewInputHash';
import {
  computeReviewActiveLevel,
  computeReviewTerminalLevel,
} from './peer/meter/computeReviewLevels';
import { getAllReviewPeerMeterStatuses } from './peer/meter/getAllReviewPeerMeterStatuses';
import { JUDGE_LEVEL } from './peer/meter/JUDGE_LEVEL';

/**
 * .what = computes the level state of a stone's guard ladder (peer levels + the judge rung)
 * .why = overrule and force must scope to the active rung, and force may only approve when the
 *        active rung is the terminal rung
 *
 * the judge is the top rung of the ladder. a judges-only stone (a guard with judges but no peer
 * reviews) is a ladder whose only rung is the judge, so its active + terminal rung is JUDGE_LEVEL.
 * a peer+judge stone extends the same ladder: once every peer level is clear-for-passage, the
 * judge rung becomes the active rung IF it ran and did not pass (a malfunction, a constraint, or a
 * threshold reject). either way an overrule of the judge targets JUDGE_LEVEL with no special-case
 * branch (see define.review.human-forgiveness.md).
 *
 * returns:
 * - hasLevels: whether the stone has a guard with rungs to scope to
 * - activeLevel: lowest unresolved rung (null when all resolved)
 * - terminalLevel: highest rung present (null when unguarded)
 * - nextActiveLevel: the rung that becomes active (ready) once the current active rung is
 *   overruled (null when none would unlock — e.g. the active rung is already terminal)
 */
export const getStoneGuardLevelState = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{
  hasLevels: boolean;
  activeLevel: number | null;
  terminalLevel: number | null;
  nextActiveLevel: number | null;
}> => {
  // no guard = no rungs to scope to
  if (!input.stone.guard) {
    return {
      hasLevels: false,
      activeLevel: null,
      terminalLevel: null,
      nextActiveLevel: null,
    };
  }

  // judges-only stone = a one-rung ladder whose sole rung is the judge
  const peerReviews = getGuardPeerReviews(input.stone.guard);
  if (peerReviews.length === 0) {
    return {
      hasLevels: true,
      activeLevel: JUDGE_LEVEL,
      terminalLevel: JUDGE_LEVEL,
      nextActiveLevel: null,
    };
  }

  // compute current peer verdicts for this stone's artifact content
  const hash = await computeStoneReviewInputHash({
    stone: input.stone,
    route: input.route,
  });
  // load human overrules (levels already waved through) FIRST, so the meter statuses are
  // overrule-aware (their awaits + overruled fields honor the waved levels)
  const overruledLevels = await getStoneGuardOverruledLevels({
    stone: input.stone,
    route: input.route,
  });

  const peerMeters = await getAllReviewPeerMeterStatuses({
    stone: input.stone,
    hash,
    route: input.route,
    exhaustedReviewerSlugs: null,
    overruledLevels,
  });

  // compute active (lowest unresolved) and terminal (highest) peer levels
  const reviewers = peerMeters.map((m) => ({
    level: m.level,
    verdict: m.verdict,
  }));
  const peerActiveLevel = computeReviewActiveLevel({
    reviewers,
    overruledLevels,
  });
  const peerTerminalLevel = computeReviewTerminalLevel(reviewers);

  // the judge is the rung above every peer level. once all peer levels are clear-for-passage
  // (peerActiveLevel null) and the judge is not already forgiven, a judge that ran and did not
  // pass becomes the live active rung — so overrule/force can target it (JUDGE_LEVEL) exactly as
  // any peer rung. this closes the "judge malfunction is unrecoverable" gap on peer+judge stones.
  const judgeRungHolds =
    peerActiveLevel === null &&
    input.stone.guard.judges.length > 0 &&
    !overruledLevels.has(JUDGE_LEVEL) &&
    isJudgeRungHeld({
      judges: await getStoneGuardJudgeVerdicts({
        stone: input.stone,
        hash,
        route: input.route,
      }),
    });

  if (judgeRungHolds) {
    return {
      hasLevels: true,
      activeLevel: JUDGE_LEVEL,
      terminalLevel: JUDGE_LEVEL,
      nextActiveLevel: null,
    };
  }

  // compute the peer level that becomes ready once the active peer level is overruled
  // .why = overrule of the active level unlocks the next level; the human
  //        should see which level becomes ready to run
  const nextPeerActiveLevel =
    peerActiveLevel === null
      ? null
      : computeReviewActiveLevel({
          reviewers,
          overruledLevels: new Set([...overruledLevels, peerActiveLevel]),
        });

  // once an overrule of the active peer level clears EVERY peer level, the judge is the next rung
  // the driver must satisfy — it is the top rung of the ladder (JUDGE_LEVEL). without this, a
  // human who overrules the topmost peer level on a peer+judge stone sees no "ready" line, as if
  // the road were clear — yet the judge rung is now the live gate. that is the same
  // display-does-not-match-reality defect this behavior exists to close, one rung up. the judge
  // is the next gate whenever a judge exists and is not already forgiven (it must still run/pass);
  // whether it has run yet is immaterial to "what becomes ready next".
  const judgeBecomesNext =
    peerActiveLevel !== null &&
    nextPeerActiveLevel === null &&
    input.stone.guard.judges.length > 0 &&
    !overruledLevels.has(JUDGE_LEVEL);
  const nextActiveLevel = judgeBecomesNext ? JUDGE_LEVEL : nextPeerActiveLevel;

  return {
    hasLevels: true,
    activeLevel: peerActiveLevel,
    terminalLevel: peerTerminalLevel,
    nextActiveLevel,
  };
};
