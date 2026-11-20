import { asRouteStoneSetCommandHead } from '../guard/review/peer/asRouteStoneSetCommandHead';
import { assertRouteFulcrumDisputeStateUnblocked } from './assertRouteFulcrumDisputeStateUnblocked';

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
}): Promise<void> =>
  assertRouteFulcrumDisputeStateUnblocked({
    route: input.route,
    refusal: {
      headline: `route.stone.set --as ${input.grant}: refused, disputes owe a verdict`,
      closer: `rule on each owed dispute, repair any unreadable fulcrum, then ${input.grant === 'approved' ? 'approve' : 'force'}`,
      commandsAfter: [
        `${asRouteStoneSetCommandHead({ stone: input.stone })} --as ${input.grant}`,
      ],
    },
    // the approval is what answers a conceded repair, so it is never refused for one
    repairs: null,
    metadata: { stone: input.stone },
  });
