import { BadRequestError } from 'helpful-errors';

import { asFulcrumRefusalReason } from './asFulcrumRefusalReason';
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
      refusal: asFulcrumRefusalReason({ message: error.message }),
    };
  }
};
