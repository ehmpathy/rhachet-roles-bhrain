import { asFulcrumCaseFromFileName } from './asFulcrumCaseFromFileName';
import { FULCRUM_VERDICT_LEDGER_NAME } from './getAllFulcrumVerdictRows';

const FULCRUM_SUMMARY_NAME = 'inventory.of=fulcrums._.md';

/**
 * .what = each file in `.fulcrums/` that should be an entry, sorted, with the case its name
 *         declares — or null where the name declares none
 * .why = invariant 5: an entry is listed, never skipped. a file whose name does not parse still
 *        rides through as an entry with no case, so the gate names it unreadable rather than a
 *        misname that hides a deferral from the human. only the summary and the ledger are not
 *        entries
 */
export const asAllFulcrumFilesDeclared = (input: {
  names: string[];
}): { name: string; declared: { slug: string; title: string } | null }[] =>
  input.names
    .filter(
      (name) =>
        name !== FULCRUM_SUMMARY_NAME && name !== FULCRUM_VERDICT_LEDGER_NAME,
    )
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, declared: asFulcrumCaseFromFileName({ name }) }));
