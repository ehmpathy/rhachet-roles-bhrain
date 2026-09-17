import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getStoneGuardOverruledLevels } from '../../../../judges/getStoneGuardOverruledLevels';
import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import { computeStoneReviewInputHash } from '../../computeStoneReviewInputHash';
import { getAllReviewPeerMeterStatuses } from './getAllReviewPeerMeterStatuses';

/**
 * .what = the LIVE peer meters for a stone — hash, overrules, and statuses, in one read
 * .why = three callers want "the meters as they stand right now, off disk": the drive-status
 *        exhausted read, the drive blocker message, and the budget emit's dispute annotation.
 *        each needs the same three steps in the same order, and a persisted artifact can be stale
 *        (a budget extended since it was written), so each must RECOMPUTE rather than trust a
 *        stamp (rule.prefer.wet-over-dry — three call sites, one truth).
 *
 * 🔴 .note = the order carries weight. the overrules are read BEFORE the statuses, so the meters
 *        come back overrule-aware — else a forgiven level reads as a live rejection and paints a
 *        false `awaits` line on the level above it (`getAllReviewPeerMeterStatuses`'s own
 *        `overruledLevels` docblock).
 *
 * .note = `exhaustedReviewerSlugs: null` — this is a STATUS read, so it holds no authoritative
 *        list from a round that just ran, and the meter calc falls back to its own heuristic.
 *        null and [] differ here; see that operation's parameter docs.
 */
export const getCurrentPeerMeters = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<GuardPeerMeterStatus[]> => {
  // compute current hash for this stone's artifacts
  const hash = await computeStoneReviewInputHash({
    stone: input.stone,
    route: input.route,
  });

  // load human overrules FIRST, so the statuses below are overrule-aware
  const overruledLevels = await getStoneGuardOverruledLevels({
    stone: input.stone,
    route: input.route,
  });

  return await getAllReviewPeerMeterStatuses({
    stone: input.stone,
    hash,
    route: input.route,
    exhaustedReviewerSlugs: null,
    overruledLevels,
  });
};
