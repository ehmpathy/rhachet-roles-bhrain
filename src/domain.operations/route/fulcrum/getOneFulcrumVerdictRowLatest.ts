import type { FulcrumVerdictRow } from './getAllFulcrumVerdictRows';

/**
 * .what = the newest ledger row for one case, or null when the lever never ruled it
 * .why = a human may change a verdict, so only the newest row speaks for the case; an older row
 *        must never prove a yaml edited back to a superseded verdict
 */
export const getOneFulcrumVerdictRowLatest = (input: {
  case: string;
  rows: FulcrumVerdictRow[];
}): FulcrumVerdictRow | null =>
  input.rows.filter((row) => row.case === input.case).at(-1) ?? null;
