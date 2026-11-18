import { BadRequestError } from 'helpful-errors';

import type { RouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';
import { getOneRouteFulcrumDisputeState } from './getOneRouteFulcrumDisputeState';

/**
 * .what = reads a route's dispute state, or the refusal that names why its record cannot be read
 * .why = a halt that only SHOWS the dispute state must render a corrupt ledger as a fact, never
 *        throw: `hook.onBoot` promises to show the stone and exit 0. the gates that GRANT still
 *        read through `getOneRouteFulcrumDisputeState` and refuse, and the onStop lint holds the
 *        stop on the same fault, so the refusal is surfaced, never swallowed
 * .note = only a BadRequestError (a constraint a human repairs) is caught; all else rises
 */
export const getOneRouteFulcrumDisputeStateOrRefusal = async (input: {
  route: string;
}): Promise<
  | { state: RouteFulcrumDisputeState; refusal: null }
  | { state: null; refusal: string }
> => {
  try {
    const state = await getOneRouteFulcrumDisputeState({ route: input.route });
    return { state, refusal: null };
  } catch (error) {
    if (!(error instanceof BadRequestError)) throw error;
    return {
      state: null,
      refusal: asRefusalReason({ message: error.message }),
    };
  }
};

/**
 * .what = a refusal's message with the class lead helpful-errors writes cut off
 * .why = the halt renders the reason as a leaf under its own header, so the class word would
 *        read as a second header
 */
const asRefusalReason = (input: { message: string }): string =>
  input.message.replace(/^(?:BadRequestError|✋ ConstraintError): /, '');
