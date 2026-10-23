import { getRouteGuardReviewPeerPathMeta } from '../guard/review/peer/getRouteGuardReviewPeerPathMeta';
import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';

/**
 * .what = the iteration of a stone's latest review round — the highest iteration any lane's
 *         given carries — or null when no lane has spoken
 * .why = a meter's `path` is the given that lane is judged on, and its filename carries the
 *        iteration it was minted in. the round a driver last saw is the latest of them; a lane
 *        that exhausted earlier still shows its own older given beneath it
 */
export const asStoneGuardRoundIteration = (input: {
  meters: GuardPeerMeterStatus[];
}): number | null => {
  const iterations = input.meters
    .map((meter) => meter.path)
    .filter((path): path is string => !!path)
    .map((path) => getRouteGuardReviewPeerPathMeta({ path }).iteration);
  if (iterations.length === 0) return null;
  return Math.max(...iterations);
};
