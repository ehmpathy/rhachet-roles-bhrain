import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

import { getOneFulcrumVerdictRowLatest } from './getOneFulcrumVerdictRowLatest';
import { isFulcrumVerdictRowOverDisputes } from './isFulcrumVerdictRowOverDisputes';

/**
 * .what = decides whether a yaml verdict is backed by the newest ledger row for its case, on the
 *         same content the human read, over every dispute that now cites it
 * .why = the halt and the linter read this, never the yaml's word alone — a forged verdict (a
 *        hand edit) has no row, a verdict flipped back to a superseded one meets a newer row that
 *        disagrees, an entry edited after the verdict no longer hashes to the row's `seen`, and a
 *        dispute raised after the verdict on an unedited entry is absent from the row's `held`.
 *        each of those owes the human again
 */
export const isFulcrumVerdictProven = (input: {
  case: string;
  ruled: 'upheld' | 'conceded';
  seen: string;
  disputes: string[];
  rows: FulcrumVerdictRow[];
}): boolean => {
  const latest = getOneFulcrumVerdictRowLatest({
    case: input.case,
    rows: input.rows,
  });
  if (!latest) return false;
  return (
    latest.ruled === input.ruled &&
    latest.seen === input.seen &&
    isFulcrumVerdictRowOverDisputes({ row: latest, disputes: input.disputes })
  );
};
