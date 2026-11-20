import { getAllPassageReportsRaw } from '../passage/getAllPassageReportsRaw';
import {
  asRouteFulcrumDisputeState,
  type RouteFulcrumDisputeState,
} from './asRouteFulcrumDisputeState';
import { getAllFulcrumVerdictRowsOrDefect } from './getAllFulcrumVerdictRowsOrDefect';
import { getAllRouteFulcrums } from './getAllRouteFulcrums';

/**
 * .what = reads a route's dispute state, or the refusal that names why its ledger cannot be read
 * .why = a halt that only SHOWS the dispute state must render a corrupt ledger as a fact, never
 *        throw: `hook.onBoot` promises to show the stone and exit 0. the gates that GRANT still
 *        read through `getOneRouteFulcrumDisputeState` and refuse, and the onStop lint holds the
 *        stop on the same fault, so the refusal is surfaced, never swallowed
 * .note = the ledger's defect arrives as data, never as a caught error, so no other fault (the
 *         passage log, a permission error) can be labeled as the ledger's; those rise
 */
export const getOneRouteFulcrumDisputeStateOrRefusal = async (input: {
  route: string;
}): Promise<
  | { state: RouteFulcrumDisputeState; refusal: null }
  | { state: null; refusal: string }
> => {
  const [fulcrums, ledger, reports] = await Promise.all([
    getAllRouteFulcrums({ route: input.route }),
    getAllFulcrumVerdictRowsOrDefect({ route: input.route }),
    getAllPassageReportsRaw({ route: input.route }),
  ]);
  if (ledger.defect !== null) return { state: null, refusal: ledger.defect };
  return {
    state: asRouteFulcrumDisputeState({ fulcrums, rows: ledger.rows, reports }),
    refusal: null,
  };
};
