import { BadRequestError } from 'helpful-errors';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { asRouteFulcrumCommandRows } from './asRouteFulcrumCommandRows';
import { asRouteFulcrumDisputeLines } from './asRouteFulcrumDisputeLines';
import { getAllRouteFulcrumRuleCommands } from './getAllRouteFulcrumRuleCommands';
import { getOneRouteFulcrumDisputeState } from './getOneRouteFulcrumDisputeState';
import { isRouteFulcrumDisputeStateBlocked } from './isRouteFulcrumDisputeStateBlocked';
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
  const state = await getOneRouteFulcrumDisputeState({ route: input.route });
  if (!isRouteFulcrumDisputeStateBlocked({ state })) return;
  const commands = getAllRouteFulcrumRuleCommands({ state });
  const lines = [
    `🗿 route.stone.set --as passed: refused, a dispute owes the human at this stone's gate`,
    ...asRouteFulcrumDisputeLines({ state }).map((line) => `   ${line}`),
    `   └─ a human must rule on each before the stone can pass`,
    ...asRouteFulcrumCommandRows({ commands }).map((row) => `      ${row}`),
  ];
  throw new BadRequestError(lines.join('\n'), {
    route: input.route,
    stone: input.stone.name,
  });
};
