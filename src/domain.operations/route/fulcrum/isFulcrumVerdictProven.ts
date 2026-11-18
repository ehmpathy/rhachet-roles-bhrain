import type { FulcrumVerdictRow } from './getAllFulcrumVerdictRows';
import { getOneFulcrumVerdictRowLatest } from './getOneFulcrumVerdictRowLatest';

/**
 * .what = decides whether a yaml verdict is backed by the newest ledger row for its case
 * .why = the halt and the linter read this, never the yaml's word alone — a forged verdict (a
 *        hand edit) has no row, and a verdict flipped back to a superseded one meets a newer row
 *        that disagrees
 */
export const isFulcrumVerdictProven = (input: {
  case: string;
  ruled: 'upheld' | 'conceded';
  rows: FulcrumVerdictRow[];
}): boolean =>
  getOneFulcrumVerdictRowLatest({ case: input.case, rows: input.rows })
    ?.ruled === input.ruled;
