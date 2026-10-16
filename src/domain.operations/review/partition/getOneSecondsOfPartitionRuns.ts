import { toMilliseconds } from 'iso-time';

import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

/**
 * .what = the one part of a run this reads — its realized time
 */
type ReviewRunOfTime = {
  metrics: {
    realized: Pick<StepReviewResult['metrics']['realized'], 'time'>;
  };
};

/**
 * .what = the wall-clock seconds a split lane took
 * .why = the prime runs first, then the partitions pour at once — so the lane's time is
 *        the prime's plus the longest partition's, never a sum of all nor a max of all
 */
export const getOneSecondsOfPartitionRuns = (input: {
  primed: ReviewRunOfTime | null;
  results: ReviewRunOfTime[];
}): number => {
  // the prime completes before the pour begins
  const msOfPrime = input.primed
    ? toMilliseconds(input.primed.metrics.realized.time)
    : 0;

  // the pour lasts as long as its slowest partition
  const msOfPour = Math.max(
    0,
    ...input.results.map((result) =>
      toMilliseconds(result.metrics.realized.time),
    ),
  );

  return Math.round((msOfPrime + msOfPour) / 1000);
};
