import * as path from 'path';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asLogDirMintedAt } from '@src/domain.operations/review/asLogDirMintedAt';
import { getOneCacheHitRate } from '@src/domain.operations/review/getOneCacheHitRate';
import { getOneGradeCensus } from '@src/domain.operations/review/getOneGradeCensus';
import { getOneReviewTokensOfRuns } from '@src/domain.operations/review/getOneReviewTokensOfRuns';
import type { CostLeverSample } from '@src/domain.operations/review/meter/getOneCostLeverFigures';
import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = one day of the grove's review runs, as a lever sample
 * .why = the grove's rollups are keyed by tree, route, stone, and slug — places,
 *        never times. a trend needs a time axis, and the one every run already
 *        carries is the instant its log dir was minted
 */
export interface GroveDaySample extends CostLeverSample {
  /** the UTC date the runs were minted on, `YYYY-MM-DD` */
  day: string;
  /** every run minted that day, any grade */
  runs: number;
}

/**
 * .what = the grove's runs cut by the UTC day they were minted, oldest first
 * .why = the series the grove breadth hands `getOneCostLeverFigures`, so both levers
 *        carry a move at this breadth as at the other two
 *        (rule.require.report-both-cost-levers-with-trend-and-locus)
 *
 * .note = a run whose log dir name carries no stamp reads as the epoch
 *         (`asLogDirMintedAt`). it is dropped from the SERIES, never from the corpus:
 *         its spend is real, and it sits on no day. a 1970 bucket would read as the
 *         first day and compute the whole move against a run with no place in time
 *
 * .note = a day, not a round: a round number is per stone, and the grove spans every
 *         stone of every tree. a day is the one axis all of them share
 */
export const getAllGroveDaySamples = (input: {
  runs: ReviewRunMeter[];
}): GroveDaySample[] => {
  // .note = deliberate mutation, and a SCOPED ZONE — a group-by, spread to a fresh
  //         array before it is returned (rule.require.immutable-vars)
  const byDay = new Map<string, ReviewRunMeter[]>();
  for (const run of input.runs) {
    const day = asRunDay({ run });
    if (day === null) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), run]);
  }

  // oldest day first
  return [...byDay.entries()]
    .sort(([a], [b]) => asDayOrder({ a, b }))
    .map(([day, runs]) => asGroveDaySample({ day, runs }));
};

/**
 * .what = one day's runs, as a lever sample
 * .why = the per-day row, named, so the series reads as "each day, as a sample" and the
 *        row's shape has one home (rule.prefer.decomposable-architecture)
 */
const asGroveDaySample = (input: {
  day: string;
  runs: ReviewRunMeter[];
}): GroveDaySample => {
  const tokens = getOneReviewTokensOfRuns({ runs: input.runs });
  return {
    day: input.day,
    runs: input.runs.length,
    metered: getOneGradeCensus({ runs: input.runs }).metered,
    tokens,
    cacheHitRate: getOneCacheHitRate({ tokens }),
  };
};

/**
 * .what = the order of iso days, oldest first
 * .why = names the sort, so the series states its order by name rather than by a closure
 *        to decode (rule.require.named-transformers). an iso date sorts lexically in time
 *        order, so a lexical compare is the time compare
 */
const asDayOrder = (input: { a: string; b: string }): number =>
  compareStrings(input.a, input.b);

/**
 * .what = the UTC day a run's log dir was minted, or null where its name holds no stamp
 */
const asRunDay = (input: { run: ReviewRunMeter }): string | null => {
  const at = asLogDirMintedAt({ name: path.basename(input.run.dir) });
  if (at.getTime() === 0) return null;
  return at.toJSON().slice(0, 10);
};
