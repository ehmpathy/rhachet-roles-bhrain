import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

import { getOneFulcrumVerdictRowLatest } from './getOneFulcrumVerdictRowLatest';

/**
 * .what = decides whether a yaml verdict is backed by the newest ledger row for its case, on the
 *         same content the human read
 * .why = the halt and the linter read this, never the yaml's word alone — a forged verdict (a
 *        hand edit) has no row, a verdict flipped back to a superseded one meets a newer row that
 *        disagrees, and an entry edited after the verdict (a concern added to `holds`) no longer
 *        hashes to the row's `seen`, so it owes the human again
 */
export const isFulcrumVerdictProven = (input: {
  case: string;
  ruled: 'upheld' | 'conceded';
  seen: string;
  rows: FulcrumVerdictRow[];
}): boolean => {
  const latest = getOneFulcrumVerdictRowLatest({
    case: input.case,
    rows: input.rows,
  });
  return latest?.ruled === input.ruled && latest.seen === input.seen;
};
