/**
 * .what = how far the cache lever moved between two samples, in percentage POINTS
 * .why = points, never percent: a rate that moves 13.7% -> 44.7% rose by 31.0 points,
 *        and to call that "+226%" is true of the ratio and unreadable
 */
export const getOneLeverCacheMovePoints = (input: {
  first: { cacheHitRate: number };
  last: { cacheHitRate: number };
}): number => (input.last.cacheHitRate - input.first.cacheHitRate) * 100;
