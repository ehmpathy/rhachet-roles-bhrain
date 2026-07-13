import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import { getAllRouteStoneGuardReviewPeerMeters } from './getAllRouteStoneGuardReviewPeerMeters';
import { setRouteStoneGuardReviewPeerMeter } from './setRouteStoneGuardReviewPeerMeter';

/**
 * .what = resets all review peer meters for a stone to 0 rounds
 * .why = enables fresh review cycle after stone rewind
 *
 * .note = appends entries with rounds: 0 (append-only, last entry wins)
 */
export const resetRouteStoneGuardReviewPeerMeters = async (input: {
  stone: string;
  route: string;
}): Promise<{ reset: number }> => {
  // load all meters for this stone
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone,
  });

  // no meters to reset
  if (meters.length === 0) return { reset: 0 };

  // reset each meter by set rounds: 0
  for (const meter of meters) {
    const resetMeter = new RouteStoneGuardReviewPeerMeter({
      stone: input.stone,
      reviewer: { slug: meter.reviewer.slug },
      rounds: 0,
    });
    await setRouteStoneGuardReviewPeerMeter({
      meter: resetMeter,
      route: input.route,
    });
  }

  return { reset: meters.length };
};
