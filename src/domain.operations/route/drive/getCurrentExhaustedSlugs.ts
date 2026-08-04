import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { getAllReviewPeerMeterStatuses } from '../guard/review/peer/meter/getAllReviewPeerMeterStatuses';
import { getExhaustedReviewerSlugs } from '../guard/review/peer/meter/getExhaustedReviewerSlugs';
import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';
import { getStoneGuardOverruledLevels } from '../judges/getStoneGuardOverruledLevels';

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

  // load human overrules so the drive-status meters are overrule-aware — the blocker/exhausted
  // messages render this tree, so an overruled level must read as forgiven (not a stale
  // `awaits` line), and the unlock footer must fire for an overrule-driven unlock
  const overruledLevels = await getStoneGuardOverruledLevels({
    stone: input.stone,
    route: input.route,
  });

  // get current peer meter statuses (uses current budget after any extensions)
  // .note = no authoritative exhausted list here (a drive-status read) → null, so the meter calc
  //         falls back to its own heuristic
  const peerMeters = await getAllReviewPeerMeterStatuses({
    stone: input.stone,
    hash,
    route: input.route,
    exhaustedReviewerSlugs: null,
    overruledLevels,
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
