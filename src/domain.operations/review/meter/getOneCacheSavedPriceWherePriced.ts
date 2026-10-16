import type { IsoPriceWords } from 'iso-price';

import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';
import { getOneCacheSavedPrice } from '@src/domain.operations/review/meter/getOneCacheSavedPrice';
import { isRunCostBreakdownReconciled } from '@src/domain.operations/review/meter/isRunCostBreakdownReconciled';

/**
 * .what = the amount a run's cache saved, where the artifact prices both dimensions
 * .why = priced only where the artifact records both the input and the cache-read
 *        rate. an older artifact carries `total` alone, so the amount its cache
 *        saved is unpriced — null, never a guess from a rate card
 *
 * 🔴 .note = and priced only where the breakdown RECONCILES with the bill. a
 *     supplier may write a spec-rate estimate per dimension beside a billed total
 *     (openrouter does); the quotient off that breakdown is a rate card, and a
 *     card that prices a cache read at the full rate reads every such run as
 *     `saved: $0` — a projection dressed as a measurement. so an unreconciled
 *     breakdown is unpriced, exactly as an absent one is
 */
export const getOneCacheSavedPriceWherePriced = (input: {
  tokens: { input: number; cacheGet: number };
  cost: Partial<ReviewRunMetricsRealized['cost']> | undefined;
}): IsoPriceWords | null => {
  const rateInput = input.cost?.input;
  const rateCacheRead = input.cost?.cacheRead;
  if (rateInput === undefined || rateCacheRead === undefined) return null;

  // the breakdown is a measurement only where it sums to what was billed
  const cacheWrite = input.cost?.cacheWrite;
  const output = input.cost?.output;
  const total = input.cost?.total;
  if (cacheWrite === undefined || output === undefined || total === undefined)
    return null;
  const isReconciled = isRunCostBreakdownReconciled({
    cost: {
      input: rateInput,
      cacheWrite,
      cacheRead: rateCacheRead,
      output,
      total,
    },
  });
  if (!isReconciled) return null;

  return getOneCacheSavedPrice({
    tokens: input.tokens,
    cost: { input: rateInput, cacheRead: rateCacheRead },
  });
};
