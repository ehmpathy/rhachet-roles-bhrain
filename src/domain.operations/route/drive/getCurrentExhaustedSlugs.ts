import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getCurrentPeerMeters } from '../guard/review/peer/meter/getCurrentPeerMeters';
import { getExhaustedReviewerSlugs } from '../guard/review/peer/meter/getExhaustedReviewerSlugs';
import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';

/**
 * .what = gets the currently exhausted reviewer slugs + their meters for a stone
 * .why = a persisted exhausted blocker/reason may be stale (budget extended since it was
 *        recorded), so the exhausted message + the exhausted-blocker branch both recompute
 *        the LIVE exhausted set from the current meters. shared by getRouteDriveBlockerMessage
 *        and getRouteDriveExhaustedMessage (rule.prefer.wet-over-dry: 2 call sites, one truth).
 *
 * .note = the three-step live load (hash → overrules → statuses) is `getCurrentPeerMeters`, lifted
 *        to the meter home once the budget emit became its third caller
 *        (rule.prefer.most-common-denominator). this operation is now the exhaustion FILTER over
 *        that load, and its name says so.
 */
export const getCurrentExhaustedSlugs = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{
  exhaustedSlugs: string[];
  meters: GuardPeerMeterStatus[];
}> => {
  // the live meters, as they stand on disk right now (uses current budget after any extensions)
  const peerMeters = await getCurrentPeerMeters({
    stone: input.stone,
    route: input.route,
  });

  // read the currently exhausted reviewer slugs (every exhausted reviewer — this drive-status
  // read excludes none; overrule-forgiveness is a passage concern, not a drive-status one, so the
  // overruled set is empty here)
  const exhaustedSlugs = getExhaustedReviewerSlugs({
    meters: peerMeters,
    overruledLevels: new Set<number>(),
  });

  return {
    exhaustedSlugs,
    meters: peerMeters,
  };
};
