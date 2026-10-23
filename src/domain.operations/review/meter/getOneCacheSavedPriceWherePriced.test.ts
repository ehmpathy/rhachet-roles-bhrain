import { asIsoPriceHuman } from 'iso-price';
import { given, then, when } from 'test-fns';

import { getOneCacheSavedPriceWherePriced } from '@src/domain.operations/review/meter/getOneCacheSavedPriceWherePriced';

const TOKENS = { input: 100, cacheGet: 100 };

describe('getOneCacheSavedPriceWherePriced', () => {
  given('[case1] a breakdown that reconciles with the bill', () => {
    when('[t0] the saved amount is priced', () => {
      then('it prices the cached tokens at the run own full rate', () => {
        const saved = getOneCacheSavedPriceWherePriced({
          tokens: TOKENS,
          cost: {
            input: asIsoPriceHuman('$1.00'),
            cacheWrite: asIsoPriceHuman('$0.00'),
            cacheRead: asIsoPriceHuman('$0.10'),
            output: asIsoPriceHuman('$0.50'),
            total: asIsoPriceHuman('$1.60'),
          },
        });
        expect(saved).toEqual('USD 0.90');
      });
    });
  });

  given('[case2] a breakdown that does not reconcile with the bill', () => {
    when('[t0] the saved amount is priced', () => {
      then('🔴 it answers null, never a rate-card projection', () => {
        const saved = getOneCacheSavedPriceWherePriced({
          tokens: TOKENS,
          cost: {
            input: asIsoPriceHuman('$1.00'),
            cacheWrite: asIsoPriceHuman('$0.00'),
            cacheRead: asIsoPriceHuman('$0.10'),
            output: asIsoPriceHuman('$0.50'),
            total: asIsoPriceHuman('$2.00'),
          },
        });
        expect(saved).toBeNull();
      });
    });
  });

  given('[case3] an artifact that carries the total alone', () => {
    when('[t0] the saved amount is priced', () => {
      then('it answers null', () => {
        const saved = getOneCacheSavedPriceWherePriced({
          tokens: TOKENS,
          cost: { total: asIsoPriceHuman('$1.60') },
        });
        expect(saved).toBeNull();
      });
    });
  });
});
