import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

import { getOneFulcrumVerdictRowLatest } from './getOneFulcrumVerdictRowLatest';
import { isFulcrumVerdictRowOverDisputes } from './isFulcrumVerdictRowOverDisputes';

/**
 * .what = decides whether a yaml verdict the lever DID write was then outlived — by an edit to
 *         the entry it ruled on, or by a dispute the human never saw
 * .why = neither is a forgery: a driver may edit a ruled fulcrum, or cite it for a new dispute.
 *        the gate reads such an entry as owed again, and says why, rather than hold the stop as
 *        forged
 */
export const isFulcrumVerdictReopened = (input: {
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
  if (latest?.ruled !== input.ruled) return false;
  return (
    latest.seen !== input.seen ||
    !isFulcrumVerdictRowOverDisputes({ row: latest, disputes: input.disputes })
  );
};
