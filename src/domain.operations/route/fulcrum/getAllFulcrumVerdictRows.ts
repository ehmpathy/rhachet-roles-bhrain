import { BadRequestError } from 'helpful-errors';

import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

import { getAllFulcrumVerdictRowsOrDefect } from './getAllFulcrumVerdictRowsOrDefect';

/**
 * .what = reads every verdict row the lever has written on a route, in the order written
 * .why = the gates that GRANT test each yaml verdict against this ledger, and refuse on a ledger
 *        they cannot read — a corrupt row proves no verdict
 */
export const getAllFulcrumVerdictRows = async (input: {
  route: string;
}): Promise<FulcrumVerdictRow[]> => {
  const ledger = await getAllFulcrumVerdictRowsOrDefect({ route: input.route });
  if (ledger.defect !== null) throw new BadRequestError(ledger.defect);
  return ledger.rows;
};
