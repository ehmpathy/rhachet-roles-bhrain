import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { compareStonePrefix } from './compareStonePrefix';
import { computeStoneOrderPrefix } from './computeStoneOrderPrefix';

/**
 * .what = computes stones affected by a rewind (target stone and all subsequent)
 * .why = enables cascade rewind by stone order prefix comparison
 */
export const computeAffectedStonesForRewind = (input: {
  stones: RouteStone[];
  fromStone: RouteStone;
}): RouteStone[] => {
  // get target stone order prefix for comparison
  const targetPrefix = computeStoneOrderPrefix({ stone: input.fromStone });

  // filter to stones at or after target
  const affected = input.stones.filter((s) => {
    const prefix = computeStoneOrderPrefix({ stone: s });
    return compareStonePrefix({ a: prefix, b: targetPrefix }) >= 0;
  });

  // sort by prefix order
  return affected.sort((a, b) => {
    const prefixA = computeStoneOrderPrefix({ stone: a });
    const prefixB = computeStoneOrderPrefix({ stone: b });
    return compareStonePrefix({ a: prefixA, b: prefixB });
  });
};
