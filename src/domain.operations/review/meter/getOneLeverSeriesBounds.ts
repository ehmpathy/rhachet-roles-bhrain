import { getAllLeverSamplesMeasured } from '@src/domain.operations/review/meter/getAllLeverSamplesMeasured';

/**
 * .what = the first and last measured samples of a lever series, oldest first
 * .why = a trend is the move between the two ends of a measured series. fewer than two
 *        measured samples bound no move, so the answer is `null` and the trend is
 *        absent — a `→ flat` on one data point is a claim about a change nobody observed
 */
export const getOneLeverSeriesBounds = <
  T extends { metered: number; cacheHitRate: number | null },
>(input: {
  series: T[];
}): {
  first: T & { cacheHitRate: number };
  last: T & { cacheHitRate: number };
} | null => {
  // only a measured sample can bound a trend
  const measured = getAllLeverSamplesMeasured({ series: input.series });
  const [first] = measured;
  const last = measured[measured.length - 1];

  // two samples at least, or no move to report
  if (measured.length < 2 || first === undefined || last === undefined)
    return null;
  return { first, last };
};
