import { getAllPassageReportsRaw } from '../passage/getAllPassageReportsRaw';
import {
  asRouteFulcrumDisputeState,
  type RouteFulcrumDisputeState,
} from './asRouteFulcrumDisputeState';
import { getAllFulcrumVerdictRows } from './getAllFulcrumVerdictRows';
import { getAllRouteFulcrums } from './getAllRouteFulcrums';

/**
 * .what = reads every fulcrum of a route and sorts it by what the human gate owes it
 * .why = the one read behind the approval refusal, the halt lines, and the last-stone check —
 *        one read, so no two surfaces can disagree on what is open
 */
export const getOneRouteFulcrumDisputeState = async (input: {
  route: string;
}): Promise<RouteFulcrumDisputeState> => {
  const [fulcrums, rows, reports] = await Promise.all([
    getAllRouteFulcrums({ route: input.route }),
    getAllFulcrumVerdictRows({ route: input.route }),
    getAllPassageReportsRaw({ route: input.route }),
  ]);
  return asRouteFulcrumDisputeState({ fulcrums, rows, reports });
};
