import type { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import { getAllRouteStoneGuardReviewPeerMeters } from './getAllRouteStoneGuardReviewPeerMeters';

/**
 * .what = reads review peer meter for a slug from reviewPeerMeters.jsonl
 * .why = enables budget state lookup for a specific reviewer per stone
 *
 * .note = getAllRouteStoneGuardReviewPeerMeters handles deduplication semantics
 */
export const getOneRouteStoneGuardReviewPeerMeter = async (input: {
  slug: string;
  stone: string;
  route: string;
}): Promise<RouteStoneGuardReviewPeerMeter | null> => {
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone,
  });

  // find entry for this slug
  const found = meters.find((m) => m.reviewer.slug === input.slug);

  return found ?? null;
};
