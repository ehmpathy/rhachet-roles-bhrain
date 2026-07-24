import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { formatRouteDriveBudgetExhausted } from './formatRouteDriveBudgetExhausted';
import { getCurrentExhaustedSlugs } from './getCurrentExhaustedSlugs';

/**
 * .what = renders the approve-or-extend onStop message for an exhausted STATUS
 * .why = an exhausted status (its own passage status, not a 'review.peer.exhausted'
 *        blocker) still needs the same approve/extend prompt the legacy blocker
 *        showed. onBoot and onStop both call this when the latest passage for the
 *        current stone is 'exhausted' — a halt(exhausted): a human must approve or
 *        extend the peer budget.
 */
export const getRouteDriveExhaustedMessage = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<string> => {
  // recompute the currently exhausted reviewer slugs + meters for the tree
  const { exhaustedSlugs, meters } = await getCurrentExhaustedSlugs({
    stone: input.stone,
    route: input.route,
  });
  return formatRouteDriveBudgetExhausted({
    route: input.route,
    stone: input.stone.name,
    reason:
      exhaustedSlugs.length > 0
        ? `peer reviewer budget exhausted: ${exhaustedSlugs.join(', ')}`
        : null,
    meters,
  });
};
