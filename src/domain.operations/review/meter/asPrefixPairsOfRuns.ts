import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asPrefixLaneKey } from '@src/domain.operations/review/meter/asPrefixLaneKey';
import {
  isReviewRunOfGuard,
  type ReviewRunMeterOfGuard,
} from '@src/domain.operations/review/meter/isReviewRunOfGuard';
import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = every consecutive pair of rounds per reviewer, each round set beside its prior
 * .why = the census the tree and grove breadths measure: a round's cache can only reuse
 *        what its reviewer's prior round sent, so each round past the first earns a pair
 *
 * .note = rounds order by their log dir, whose name leads with an iso stamp, so a
 *         lexical sort is a chronological one (`getOneReviewRunMeterLatest`). a run with
 *         no guard identity has no reviewer and no prior, so it pairs with naught
 */
export const asPrefixPairsOfRuns = (input: {
  runs: ReviewRunMeter[];
}): Array<{
  prior: ReviewRunMeterOfGuard;
  round: ReviewRunMeterOfGuard;
}> => {
  // .note = deliberate mutation, and a scoped zone — a group-by folds many runs onto
  //         one key, and the map never escapes (rule.require.immutable-vars)
  const byLane = new Map<string, ReviewRunMeterOfGuard[]>();
  for (const run of input.runs.filter(isReviewRunOfGuard)) {
    const key = asPrefixLaneKey({ identity: run.identity });
    byLane.set(key, [...(byLane.get(key) ?? []), run]);
  }

  // each lane in time order, each round past the first beside the round before it
  return [...byLane.values()].flatMap((lane) => {
    const ordered = [...lane].sort((a, b) => compareStrings(a.dir, b.dir));
    return ordered.flatMap((round, index) => {
      const prior = ordered[index - 1];
      return prior === undefined ? [] : [{ prior, round }];
    });
  });
};
