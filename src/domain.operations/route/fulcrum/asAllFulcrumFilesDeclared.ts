import { compareStrings } from '@src/utils/compareStrings';

import { asFulcrumCaseFromFileName } from './asFulcrumCaseFromFileName';

const FULCRUM_ENTRY_PREFIX = 'inventory.of=fulcrums.';
const FULCRUM_SUMMARY_NAME = 'inventory.of=fulcrums._.md';

/**
 * .what = each file in `.fulcrums/` that names itself an entry, sorted, with the case its name
 *         declares — or null where the name declares none
 * .why = invariant 5: an entry is listed, never skipped. a file under the entry prefix whose name
 *        does not parse still rides through as an entry with no case, so the gate names it
 *        unreadable rather than a misname that hides a deferral from the human
 *
 * .note = only the entry prefix is an entry. a file outside it (`.DS_Store`, a swap file, the
 *         ledger) is not, so it cannot hold every stop. a misnamed entry that a dispute cites is
 *         still caught: the dispute-time check refuses its name, and the gate names the cited
 *         case orphaned when no entry carries it
 */
export const asAllFulcrumFilesDeclared = (input: {
  names: string[];
}): { name: string; declared: { slug: string; title: string } | null }[] =>
  input.names
    .filter(
      (name) =>
        name.startsWith(FULCRUM_ENTRY_PREFIX) && name !== FULCRUM_SUMMARY_NAME,
    )
    .sort(compareStrings)
    .map((name) => ({ name, declared: asFulcrumCaseFromFileName({ name }) }));
