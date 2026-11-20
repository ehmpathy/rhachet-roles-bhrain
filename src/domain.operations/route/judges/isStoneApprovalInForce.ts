import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import type { RouteFulcrumDisputeState } from '../fulcrum/asRouteFulcrumDisputeState';
import { getAllRouteFulcrumRepairsOwed } from '../fulcrum/getAllRouteFulcrumRepairsOwed';
import { isRouteFulcrumDisputeStateBlocked } from '../fulcrum/isRouteFulcrumDisputeStateBlocked';
import { isStoneGatedByHuman } from '../fulcrum/isStoneGatedByHuman';

/**
 * .what = decides whether an approval on record is still in force for a stone
 * .why = "is this stone approved?" has many readers (the `approved?` judge, the drive halt, the
 *        exhausted bypass, the approval writer). one rule for all of them, so a dispute raised
 *        after the approval holds the stone at its gate as a recorded halt the human reads, never
 *        as a throw the driver retries into (r011 i009 blocker.1)
 *
 * .note = an approval on a human-gated stone is in force only while no dispute owes the human, no
 *         entry is unreadable, and no conceded repair awaits an approval after its verdict. a
 *         stone with no human gate keeps its approval: a dispute never halts it (invariant 1)
 * .note = an unreadable ledger (`state: null`) fails closed: the approval is not in force, and
 *         the halt renders the refusal that names the fault
 */
export const isStoneApprovalInForce = (input: {
  stone: RouteStone;
  state: RouteFulcrumDisputeState | null;
}): boolean => {
  // a stone with no human gate never halts on a dispute
  if (!isStoneGatedByHuman({ stone: input.stone })) return true;

  // an unreadable ledger holds the gate
  if (!input.state) return false;

  // a dispute owed the human, or an unreadable fulcrum, holds the gate
  if (isRouteFulcrumDisputeStateBlocked({ state: input.state })) return false;

  // a conceded repair no approval has followed holds the gate
  return getAllRouteFulcrumRepairsOwed({ state: input.state }).length === 0;
};
