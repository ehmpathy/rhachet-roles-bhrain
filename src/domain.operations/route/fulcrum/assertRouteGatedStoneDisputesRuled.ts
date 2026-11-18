import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { assertRouteFulcrumDisputeStateUnblocked } from './assertRouteFulcrumDisputeStateUnblocked';
import { isStoneGatedByHuman } from './isStoneGatedByHuman';

/**
 * .what = refuses a human-gated stone's passage while a dispute owes the human
 * .why = invariant 2 reconciles a dispute at the human gate. the approval refusal shows every
 *        dispute open at approval time, but a dispute raised AFTER the human approved would
 *        otherwise pass through the gate the human already opened, unseen. so the gate holds at
 *        passage too, until a human rules each
 */
export const assertRouteGatedStoneDisputesRuled = async (input: {
  route: string;
  stone: RouteStone;
}): Promise<void> => {
  // only a stone with its own human gate is in scope; an ungated stone never halts (invariant 1)
  if (!isStoneGatedByHuman({ stone: input.stone })) return;

  // refuse while a dispute owes the human, and name each
  await assertRouteFulcrumDisputeStateUnblocked({
    route: input.route,
    refusal: {
      headline: `route.stone.set --as passed: refused, a dispute owes the human at this stone's gate`,
      closer: 'a human must rule on each before the stone can pass',
      commandsAfter: [],
    },
    metadata: { stone: input.stone.name },
  });
};
