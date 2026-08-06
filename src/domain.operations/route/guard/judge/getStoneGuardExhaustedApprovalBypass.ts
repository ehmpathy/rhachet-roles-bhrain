import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getOneStoneGuardApproval } from '../../judges/getOneStoneGuardApproval';
import { getAllReviewPeerMeterStatuses } from '../review/peer/meter/getAllReviewPeerMeterStatuses';
import type { GuardPeerMeterStatus } from '../tree/formatGuardTree';
import { computeStoneGuardExhaustedApprovalBypass } from './computeStoneGuardExhaustedApprovalBypass';

/**
 * .what = loads the peer statuses + human approval for a stone, then decides whether the
 *         exhausted-reviewer + approval bypass applies. returns the peer statuses it loaded so the
 *         caller can reuse them.
 * .why = the reviewed? judge grants passage on a stone whose reviewers are spent when a human has
 *        signed off (per wish). this is the thin fs-read wrapper over the pure decision core
 *        `computeStoneGuardExhaustedApprovalBypass`; the peer statuses are returned alongside so the
 *        has-files judge path reuses them for the level-clearance ladder without a second fs load.
 *
 * .note = one source of truth for this clause: judgeReviewed calls it from BOTH its no-files and
 *         has-files branches, so the invariant lives here once and the two branches cannot drift.
 */
export const getStoneGuardExhaustedApprovalBypass = async (input: {
  stone: RouteStone;
  hash: string;
  route: string;
  overruledLevels: Set<number>;
}): Promise<{ peerStatuses: GuardPeerMeterStatus[]; bypass: boolean }> => {
  // load full peer meter status for every reviewer at the current hash
  const peerStatuses = await getAllReviewPeerMeterStatuses({
    stone: input.stone,
    hash: input.hash,
    route: input.route,
    exhaustedReviewerSlugs: null,
    overruledLevels: input.overruledLevels,
  });

  // load whether a human approval is on record for this stone
  const approval = await getOneStoneGuardApproval({
    stone: input.stone,
    route: input.route,
  });

  // decide the bypass from the loaded data (pure core)
  const bypass = computeStoneGuardExhaustedApprovalBypass({
    reviewers: peerStatuses.map((s) => ({
      level: s.level,
      verdict: s.verdict,
    })),
    overruledLevels: input.overruledLevels,
    approvalPresent: !!approval,
  });

  return { peerStatuses, bypass };
};
