import { asIsoPrice } from 'iso-price';
import type { BrainOutputMetrics } from 'rhachet';
import { given, then, when } from 'test-fns';

import { asReviewRunMetricsRealized } from './asReviewRunMetricsRealized';

// whole-cent prices, so the human form reads at its standard two places
const METRICS: BrainOutputMetrics = {
  size: {
    tokens: { input: 1000, output: 50, cache: { get: 600, set: 200 } },
    chars: { input: 4000, output: 200, cache: { get: 2400, set: 800 } },
  },
  cost: {
    time: { seconds: 7 },
    cash: {
      total: asIsoPrice('USD 0.10'),
      deets: {
        input: asIsoPrice('USD 0.01'),
        output: asIsoPrice('USD 0.02'),
        cache: { get: asIsoPrice('USD 0.03'), set: asIsoPrice('USD 0.04') },
      },
    },
  },
};

describe('asReviewRunMetricsRealized', () => {
  given('[case1] the brain metrics of one call', () => {
    when('[t0] cast with the brain clock as its time', () => {
      const realized = asReviewRunMetricsRealized({
        metrics: METRICS,
        time: METRICS.cost.time,
      });

      then('each token axis maps to its realized key', () => {
        expect(realized.tokens).toEqual({
          input: 1000,
          inputCacheCreation: 200,
          inputCacheRead: 600,
          output: 50,
        });
      });

      then(
        'each price is cast to its human form, cache set to write, get to read',
        () => {
          expect(realized.cost).toEqual({
            input: '$0.01',
            cacheWrite: '$0.04',
            cacheRead: '$0.03',
            output: '$0.02',
            total: '$0.10',
          });
        },
      );

      then('the time is the one given', () => {
        expect(realized.time).toEqual({ seconds: 7 });
      });
    });

    when('[t1] cast with a wall-clock time, as a prime does', () => {
      const realized = asReviewRunMetricsRealized({
        metrics: METRICS,
        time: { seconds: 3 },
      });

      then('the given time wins over the brain clock', () => {
        expect(realized.time).toEqual({ seconds: 3 });
      });
    });
  });
});
