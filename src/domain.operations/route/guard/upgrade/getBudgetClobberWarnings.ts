import {
  getGuardPeerReviews,
  type RouteStoneGuard,
} from '@src/domain.objects/Driver/RouteStoneGuard';

import type { GuardUpgradeWarning } from './GuardUpgradeWarning';

/**
 * .what = flags when an upgrade would REVERT a human-granted peer-review budget (B4)
 * .why = route.guard.budget lets a human raise a reviewer's round budget in-place; an
 *   upgrade overwrites the whole guard from its template, so a template whose budget is
 *   lower than the current guard silently reverts that grant. this surfaces the loss
 *   BEFORE apply so a driver is never surprised.
 *
 * .note = pure — takes two already-parsed guards and yields structured warnings; the
 *   renderer owns the prose.
 */
export const getBudgetClobberWarnings = (input: {
  current: RouteStoneGuard;
  next: RouteStoneGuard;
}): GuardUpgradeWarning[] => {
  const nextBudgetBySlug = new Map(
    getGuardPeerReviews(input.next).map((peer) => [peer.slug, peer.budget]),
  );

  return getGuardPeerReviews(input.current).flatMap(
    (peer): GuardUpgradeWarning[] => {
      const nextBudget = nextBudgetBySlug.get(peer.slug);
      if (nextBudget !== undefined && peer.budget > nextBudget)
        return [
          {
            type: 'budget-clobber',
            slug: peer.slug,
            before: peer.budget,
            after: nextBudget,
          },
        ];
      return [];
    },
  );
};
