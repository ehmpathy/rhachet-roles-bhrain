import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { asRouteFulcrumRepairsOwedRefusal } from './asRouteFulcrumRepairsOwedRefusal';
import { assertRouteFulcrumDisputeStateUnblocked } from './assertRouteFulcrumDisputeStateUnblocked';
import { isStoneGatedByHuman } from './isStoneGatedByHuman';

/**
 * .what = refuses the last stone's passage while a dispute owes the human, unless that stone
 *         carries its own human gate
 * .why = invariant 1 lets a dispute ride past every ungated stone, so the last stone is the one
 *        place it must surface (fulcrum F5, ruled upheld). a human gate on an EARLIER stone does
 *        not count: the route already passed it, so a dispute raised after it would finish unseen.
 *        a last stone with its own `approved?` judge needs no check here — its approval refusal
 *        already names every open dispute
 */
export const assertRouteGatelessLastStoneDisputesRuled = async (input: {
  route: string;
  stone: RouteStone;
  stones: RouteStone[];
}): Promise<void> => {
  // only the last stone is in scope, and only where it carries no human gate of its own
  const isLast = input.stones.at(-1)?.name === input.stone.name;
  if (!isLast) return;
  if (isStoneGatedByHuman({ stone: input.stone })) return;

  // refuse while a dispute owes the human, and name each
  await assertRouteFulcrumDisputeStateUnblocked({
    route: input.route,
    refusal: {
      headline: `route.stone.set --as passed: refused, the last stone has no human gate and disputes owe a verdict`,
      closer: 'a human must rule on each before the route can finish',
      commandsAfter: [],
    },
    repairs: asRouteFulcrumRepairsOwedRefusal({ stone: input.stone.name }),
    metadata: { stone: input.stone.name },
  });
};
