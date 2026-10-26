import { ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS } from './ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS';

/**
 * .what = whether a cache written at `writtenAtMs` is younger than the max age, at `nowMs`
 * .why = the backstop for a render input the fingerprint does not name; a write time ahead
 *        of now (a clock step back) reads as stale, never as fresh
 *
 * .note = raw ms, not `iso-time`, by design: this runs on every hit, and the hit path loads
 *         no node_modules module (the module-graph clamp, acceptance `[case16]`)
 * .note = the write time is floored to whole ms: a file mtime carries sub-ms precision while
 *         `Date.now()` does not, so a read in the same ms as the write would else read as a
 *         write ahead of now, and a fresh cache would miss
 */
export const isRouteStatusLineCacheAgeWithinMax = (input: {
  writtenAtMs: number;
  nowMs: number;
}): boolean => {
  const ageMs = input.nowMs - Math.floor(input.writtenAtMs);
  return ageMs >= 0 && ageMs < ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS;
};
