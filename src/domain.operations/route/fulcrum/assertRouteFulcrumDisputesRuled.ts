import { BadRequestError } from 'helpful-errors';

import { asRouteStoneSetCommandHead } from '../guard/review/peer/asRouteStoneSetCommandHead';
import { asRouteFulcrumCommandRows } from './asRouteFulcrumCommandRows';
import { asRouteFulcrumDisputeLines } from './asRouteFulcrumDisputeLines';
import { getAllRouteFulcrumRuleCommands } from './getAllRouteFulcrumRuleCommands';
import { getOneRouteFulcrumDisputeState } from './getOneRouteFulcrumDisputeState';
import { isRouteFulcrumDisputeStateBlocked } from './isRouteFulcrumDisputeStateBlocked';

/**
 * .what = refuses a human grant (`--as approved`, `--as forced`) while any dispute owes a verdict
 * .why = invariant 2: the approval halt lists each dispute that owes the human, and the grant is
 *        refused until each is ruled. the refusal carries the full lines, since it is the one
 *        surface a human surely reads
 */
export const assertRouteFulcrumDisputesRuled = async (input: {
  route: string;
  stone: string;
  grant: 'approved' | 'forced';
}): Promise<void> => {
  const state = await getOneRouteFulcrumDisputeState({ route: input.route });
  if (!isRouteFulcrumDisputeStateBlocked({ state })) return;

  // render the refusal: the open disputes, then the commands that clear them
  const ruleCommands = getAllRouteFulcrumRuleCommands({ state });
  const grantCommand = `${asRouteStoneSetCommandHead({ stone: input.stone })} --as ${input.grant}`;
  const lines = [
    `🗿 route.stone.set --as ${input.grant}: refused, disputes owe a verdict`,
    ...asRouteFulcrumDisputeLines({ state }).map((line) => `   ${line}`),
    `   └─ rule on each, repair each unreadable fulcrum, then ${input.grant === 'approved' ? 'approve' : 'force'}`,
    ...asRouteFulcrumCommandRows({
      commands: [...ruleCommands, grantCommand],
    }).map((row) => `      ${row}`),
  ];
  throw new BadRequestError(lines.join('\n'), {
    route: input.route,
    stone: input.stone,
  });
};
