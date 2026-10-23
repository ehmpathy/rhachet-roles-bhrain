import type { PrimeWatermark, PrimeWatermarkReleased } from './PrimeWatermark';

/**
 * .what = whether a meet watermark records the release of its current claim
 * .why = a type predicate, so a reader that branches on it reads `primedAt` as a number with
 *        no `!` (rule.forbid.as-cast). a release written by some prior claim's holder does not
 *        count: only the holder of the current claim may release it
 */
export const isPrimeWatermarkReleased = (
  found: PrimeWatermark | null,
): found is PrimeWatermarkReleased =>
  found !== null &&
  found.primedBy !== null &&
  found.primedBy === found.claimedBy &&
  found.primedAt !== null;
