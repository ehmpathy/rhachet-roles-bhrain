import { BadRequestError } from 'helpful-errors';

import { asRouteFulcrumDisputeRefusalLines } from './asRouteFulcrumDisputeRefusalLines';
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
  metadata: Record<string, string>;
}): Promise<void> => {
  const state = await getOneRouteFulcrumDisputeState({ route: input.route });
  if (!isRouteFulcrumDisputeStateBlocked({ state })) return;
  const lines = asRouteFulcrumDisputeRefusalLines({
    headline: input.refusal.headline,
    state,
    closer: input.refusal.closer,
    commands: [
      ...getAllRouteFulcrumVerdictCommands({ state }),
      ...input.refusal.commandsAfter,
    ],
  });
  throw new BadRequestError(lines.join('\n'), {
    route: input.route,
    ...input.metadata,
  });
};
