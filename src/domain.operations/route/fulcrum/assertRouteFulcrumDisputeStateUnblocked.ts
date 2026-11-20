import { BadRequestError } from 'helpful-errors';

import { asRouteFulcrumDisputeRefusalLines } from './asRouteFulcrumDisputeRefusalLines';
import { getAllRouteFulcrumRepairsOwed } from './getAllRouteFulcrumRepairsOwed';
import { getAllRouteFulcrumVerdictCommands } from './getAllRouteFulcrumVerdictCommands';
import { getOneRouteFulcrumDisputeState } from './getOneRouteFulcrumDisputeState';
import { isRouteFulcrumDisputeStateBlocked } from './isRouteFulcrumDisputeStateBlocked';

/**
 * .what = refuses an act while any dispute on the route owes the human, with the refusal tree
 *         every dispute gate throws
 * .why = the approval, gated-passage, and gateless-last-stone gates differ only in their scope
 *        and their words; one skeleton (read, check, render, throw) so a gate added later
 *        cannot render a different tree or forget the verdict commands
 */
export const assertRouteFulcrumDisputeStateUnblocked = async (input: {
  route: string;
  refusal: {
    headline: string;
    closer: string;
    /**
     * commands the caller runs after each verdict, e.g. the grant it was refused
     */
    commandsAfter: string[];
  };
  /**
   * the refusal when every dispute is ruled but a conceded repair awaits an approval after it, or
   * null where the act itself is what answers the repair (the approval grant)
   */
  repairs: {
    headline: string;
    closer: string;
    commandsAfter: string[];
  } | null;
  metadata: Record<string, string>;
}): Promise<void> => {
  const state = await getOneRouteFulcrumDisputeState({ route: input.route });

  // a dispute that owes the human, or an unreadable entry, refuses first
  if (isRouteFulcrumDisputeStateBlocked({ state }))
    throw new BadRequestError(
      asRouteFulcrumDisputeRefusalLines({
        headline: input.refusal.headline,
        state,
        closer: input.refusal.closer,
        commands: [
          ...getAllRouteFulcrumVerdictCommands({ state }),
          ...input.refusal.commandsAfter,
        ],
      }).join('\n'),
      { route: input.route, ...input.metadata },
    );

  // a conceded repair no approval has followed refuses passage: an approval granted before the
  // verdict never saw the repair (F6), so the human approves once more after it lands
  if (input.repairs && getAllRouteFulcrumRepairsOwed({ state }).length)
    throw new BadRequestError(
      asRouteFulcrumDisputeRefusalLines({
        headline: input.repairs.headline,
        state,
        closer: input.repairs.closer,
        commands: input.repairs.commandsAfter,
      }).join('\n'),
      { route: input.route, ...input.metadata },
    );
};
