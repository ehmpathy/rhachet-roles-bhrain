import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import type { RouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';
import { getAllRouteFulcrumRepairsOwed } from './getAllRouteFulcrumRepairsOwed';
import { isRouteFulcrumDisputeStateBlocked } from './isRouteFulcrumDisputeStateBlocked';
import { isStoneGatedByHuman } from './isStoneGatedByHuman';

/**
 * .what = decides whether a dispute holds the last stone of a route that has no human gate there
 * .why = invariant 1 lets a dispute ride past every ungated stone, so the last stone is the one
 *        place it must surface (F5). the passage entrance reads this before any review runs, so
 *        the hold is a recorded halt the human reads, never a throw after a paid round
 *        (r011 i011 blocker.1)
 *
 * .note = the gated-stone arm of the same question is `isStoneApprovalInForce`: a human gate on
 *         the stone itself holds it at its `approved?` judge. this arm covers the last stone
 *         with no such gate; any other ungated stone is never held (invariant 1)
 * .note = an unreadable ledger (`state: null`) fails closed: the stone is held, and the halt
 *         renders the refusal that names the fault
 */
export const isStoneLastHeldByDispute = (input: {
  stone: RouteStone;
  stones: RouteStone[];
  state: RouteFulcrumDisputeState | null;
}): boolean => {
  // only the last stone, and only where it carries no human gate of its own
  if (input.stones.at(-1)?.name !== input.stone.name) return false;
  if (isStoneGatedByHuman({ stone: input.stone })) return false;

  // an unreadable ledger, a dispute owed the human, or an unreadable fulcrum holds it
  if (!input.state) return true;
  if (isRouteFulcrumDisputeStateBlocked({ state: input.state })) return true;

  // a conceded repair no approval has followed holds it
  return getAllRouteFulcrumRepairsOwed({ state: input.state }).length > 0;
};
