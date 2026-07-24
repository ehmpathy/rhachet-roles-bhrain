import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { getAllReviewPeerMeterStatuses } from '../guard/review/peer/meter/getAllReviewPeerMeterStatuses';
import { isReviewPeerVerdictExhausted } from '../guard/review/peer/meter/isReviewPeerLevelTerminal';
import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';

/**
 * .what = gets the currently exhausted reviewer slugs + their meters for a stone
 * .why = a persisted exhausted blocker/reason may be stale (budget extended since it was
 *        recorded), so the exhausted message + the exhausted-blocker branch both recompute
 *        the LIVE exhausted set from the current meters. shared by getRouteDriveBlockerMessage
 *        and getRouteDriveExhaustedMessage (rule.prefer.wet-over-dry: 2 call sites, one truth).
 */
export const getCurrentExhaustedSlugs = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{
  exhaustedSlugs: string[];
  meters: GuardPeerMeterStatus[];
}> => {
  // compute current hash for this stone's artifacts
  const hash = await computeStoneReviewInputHash({
    stone: input.stone,
    route: input.route,
  });

  // get current peer meter statuses (uses current budget after any extensions)
  const peerMeters = await getAllReviewPeerMeterStatuses({
    stone: input.stone,
    hash,
    route: input.route,
  });

  // filter to currently exhausted
  const exhaustedSlugs = peerMeters
    .filter((m) => isReviewPeerVerdictExhausted(m.verdict))
    .map((m) => m.slug);

  return {
    exhaustedSlugs,
    meters: peerMeters,
  };
};
