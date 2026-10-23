import { asIsoPriceHuman } from 'iso-price';
import type { BrainOutputMetrics } from 'rhachet';

import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';

/**
 * .what = a run's realized figures, cast from the brain's own metrics
 * .why = a review and a partition prime both record what a brain call spent, in the shape
 *        every run records. one cast keeps the two in step: a token axis or a cost field
 *        added here reaches both, where two copies would let a prime and a review that
 *        share one type quietly disagree (rule.require.single-source-of-truth-for-render)
 *
 * .note = `time` is an input, not a read of `metrics.cost.time`: a review reports the
 *         brain's own clock, and a prime reports the wall time of its poke
 */
export const asReviewRunMetricsRealized = (input: {
  metrics: BrainOutputMetrics;
  time: ReviewRunMetricsRealized['time'];
}): Omit<ReviewRunMetricsRealized, 'compiled' | 'supply' | 'runaways'> => {
  // 🔴 the annotation is the LINK to the read side — an inferred literal here
  // let a rename change the json keys with no compile error anywhere
  const tokens: ReviewRunMetricsRealized['tokens'] = {
    input: input.metrics.size.tokens.input,
    inputCacheCreation: input.metrics.size.tokens.cache.set,
    inputCacheRead: input.metrics.size.tokens.cache.get,
    output: input.metrics.size.tokens.output,
  };
  return {
    tokens,
    cost: {
      input: asIsoPriceHuman(input.metrics.cost.cash.deets.input),
      cacheWrite: asIsoPriceHuman(input.metrics.cost.cash.deets.cache.set),
      cacheRead: asIsoPriceHuman(input.metrics.cost.cash.deets.cache.get),
      output: asIsoPriceHuman(input.metrics.cost.cash.deets.output),
      total: asIsoPriceHuman(input.metrics.cost.cash.total),
    },
    time: input.time,
  };
};
