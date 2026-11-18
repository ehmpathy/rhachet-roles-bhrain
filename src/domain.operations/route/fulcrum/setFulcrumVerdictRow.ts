import * as fs from 'fs/promises';
import * as path from 'path';

import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

import { FULCRUM_VERDICT_LEDGER_NAME } from './FULCRUM_VERDICT_LEDGER_NAME';
import { getAllFulcrumVerdictRows } from './getAllFulcrumVerdictRows';
import { getOneFulcrumVerdictRowLatest } from './getOneFulcrumVerdictRowLatest';

/**
 * .what = findserts one verdict row into the route's fulcrum verdict ledger
 * .why = the human-only lever's second half; the yaml field alone proves no human ruled.
 *        a row whose verdict and content hash equal the case's newest row is already on record,
 *        so a retry adds no second row; a changed verdict, or a verdict on edited content,
 *        appends, and the newest row then speaks for the case
 */
export const setFulcrumVerdictRow = async (input: {
  route: string;
  row: FulcrumVerdictRow;
}): Promise<{ path: string; outcome: 'appended' | 'found' }> => {
  const ledger = path.join(
    input.route,
    '.fulcrums',
    FULCRUM_VERDICT_LEDGER_NAME,
  );

  // a verdict already on record as the newest for its case is found, never appended twice
  const rows = await getAllFulcrumVerdictRows({ route: input.route });
  const latest = getOneFulcrumVerdictRowLatest({ case: input.row.case, rows });
  if (latest?.ruled === input.row.ruled && latest.seen === input.row.seen)
    return { path: ledger, outcome: 'found' };

  // append the new verdict
  await fs.mkdir(path.dirname(ledger), { recursive: true });
  await fs.appendFile(ledger, `${JSON.stringify(input.row)}\n`);
  return { path: ledger, outcome: 'appended' };
};
