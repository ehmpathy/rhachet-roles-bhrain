import { asIsoPriceHuman, priceSum } from 'iso-price';

import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';

type ReviewCost = NonNullable<ReviewRunMetricsRealized['cost']>;

/**
 * .what = sums a set of realized costs, line by line
 * .why = the cost twin of `getOneReviewTokensSummed`: every fold of realized costs — a split
 *        lane over its partitions, a run over its runaway asks — sums here, so a cost line
 *        added to the shape is summed in one place or fails the type check here, never
 *        dropped silently at one call site
 * .note = seeded with a nil per line, so an empty set sums to $0 rather than throws
 */
export const getOneReviewCostsSummed = (input: {
  costs: ReviewCost[];
}): ReviewCost => {
  const sumOf = (pick: (cost: ReviewCost) => string): ReviewCost['total'] =>
    asIsoPriceHuman(priceSum(['USD 0', ...input.costs.map(pick)]));
  return {
    input: sumOf((cost) => cost.input),
    cacheWrite: sumOf((cost) => cost.cacheWrite),
    cacheRead: sumOf((cost) => cost.cacheRead),
    output: sumOf((cost) => cost.output),
    total: sumOf((cost) => cost.total),
  };
};
