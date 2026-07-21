import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import type { GuardUpgradeWarning } from './GuardUpgradeWarning';
import { getBudgetClobberWarnings } from './getBudgetClobberWarnings';
import { getPassageStateWarnings } from './getPassageStateWarnings';

/**
 * .what = the ONE composer of every plan-mode advisory for an upgrade decision
 * .why = both advisory sources (passage state N6/i015, budget clobber B4) meet here, so
 *   the decide orchestrator calls a single named step instead of an inline spread of two
 *   producers. it takes the already-parsed guards so neither side re-parses the content.
 *
 * .note = called for the 'upgrade' decision only. currentGuard/nextGuard are null when a
 *   side could not be parsed as a guard (best-effort); the budget check is then skipped.
 */
export const getAllGuardUpgradeWarnings = async (input: {
  guardName: string;
  route: string;
  currentGuard: RouteStoneGuard | null;
  nextGuard: RouteStoneGuard | null;
}): Promise<GuardUpgradeWarning[]> => {
  const stone = input.guardName.replace(/\.guard$/, '');

  // N6/i015 — passage-state advisories from disk
  const passageWarnings = await getPassageStateWarnings({
    stone,
    route: input.route,
  });

  // B4 — reverted-budget-grant advisories, only when both guards parsed
  const budgetWarnings =
    input.currentGuard && input.nextGuard
      ? getBudgetClobberWarnings({
          current: input.currentGuard,
          next: input.nextGuard,
        })
      : [];

  return [...passageWarnings, ...budgetWarnings];
};
