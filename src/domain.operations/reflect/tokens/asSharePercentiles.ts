/**
 * .what = the 10th, 50th, and 90th percentile of a list of shares, by nearest rank
 * .why = a corpus share is a sum; the spread says whether every session holds that share
 *        or a few sessions hold it all
 *
 * .note = nearest rank picks a value that some session actually had, never a blend
 */
export const asSharePercentiles = (input: {
  shares: number[];
}): { p10: number; p50: number; p90: number } | null => {
  if (input.shares.length === 0) return null;
  const sorted = [...input.shares].sort((a, b) => a - b);
  const at = (of: { percentile: number }): number =>
    sorted[
      Math.min(
        sorted.length - 1,
        Math.max(0, Math.ceil(of.percentile * sorted.length) - 1),
      )
    ]!;
  return {
    p10: at({ percentile: 0.1 }),
    p50: at({ percentile: 0.5 }),
    p90: at({ percentile: 0.9 }),
  };
};
