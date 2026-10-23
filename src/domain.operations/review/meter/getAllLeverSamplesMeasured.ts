/**
 * .what = the lever samples that were measured — at least one metered run, and a hit rate
 * .why = only a measured sample can bound a trend; an unknown one would read as a drop
 *        to zero. the predicate narrows `cacheHitRate` to a number, so the trend
 *        arithmetic downstream needs no non-null assertion
 */
export const getAllLeverSamplesMeasured = <
  T extends { metered: number; cacheHitRate: number | null },
>(input: {
  series: T[];
}): (T & { cacheHitRate: number })[] =>
  input.series.filter(
    (sample): sample is T & { cacheHitRate: number } =>
      sample.metered > 0 && sample.cacheHitRate !== null,
  );
