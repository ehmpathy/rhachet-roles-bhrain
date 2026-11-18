import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

import { getOneFulcrumVerdictRowLatest } from './getOneFulcrumVerdictRowLatest';

/**
 * .what = decides whether a yaml verdict the lever DID write was then outlived by an edit to the
 *         entry it ruled on
 * .why = an edit after a verdict is no forgery — a driver may cite a ruled fulcrum for a new
 *        dispute, which adds to `holds`. the gate reads such an entry as owed again, and says why,
 *        rather than hold the stop as forged
 */
export const isFulcrumVerdictReopened = (input: {
  case: string;
  ruled: 'upheld' | 'conceded';
  seen: string;
  rows: FulcrumVerdictRow[];
}): boolean => {
  const latest = getOneFulcrumVerdictRowLatest({
    case: input.case,
    rows: input.rows,
  });
  return latest?.ruled === input.ruled && latest.seen !== input.seen;
};
