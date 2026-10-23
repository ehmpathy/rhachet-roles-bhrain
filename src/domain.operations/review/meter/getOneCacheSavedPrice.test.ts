import { asIsoPriceShape, priceSub } from 'iso-price';
import { given, then, when } from 'test-fns';

import { getOneCacheSavedPrice } from './getOneCacheSavedPrice';

/**
 * .what = reads a price as its signed minor-unit amount, relative to an expected figure
 * .why = two equal prices may carry different precision ('USD 0.48' vs 'USD 0.480_000'),
 *        so equality is read off their difference, never off their words
 */
const asDeltaFrom = (input: { of: string; expected: string }): bigint =>
  asIsoPriceShape(priceSub(input.of, input.expected)).amount;

describe('getOneCacheSavedPrice', () => {
  given('[case1] a run that read half its prompt from cache', () => {
    when('[t0] the amount saved is priced', () => {
      then(
        'it is the cached tokens at the run own full rate, less the cache bill',
        () => {
          // full rate = $1.00 / 1_000_000 tokens; 500_000 cached tokens at full rate
          // = $0.50, and the cache charged $0.02 for them
          const saved = getOneCacheSavedPrice({
            tokens: { input: 1_000_000, cacheGet: 500_000 },
            cost: { input: '$1.00', cacheRead: '$0.02' },
          });
          expect(saved).not.toBeNull();
          expect(asDeltaFrom({ of: saved!, expected: 'USD 0.48' })).toEqual(0n);
        },
      );
    });
  });

  given('[case2] a run with no cache read at all', () => {
    when('[t0] the amount saved is priced', () => {
      then('it is zero, a measured nil', () => {
        const saved = getOneCacheSavedPrice({
          tokens: { input: 596_134, cacheGet: 0 },
          cost: { input: '$0.131149480', cacheRead: '$0' },
        });
        expect(saved).not.toBeNull();
        expect(asDeltaFrom({ of: saved!, expected: 'USD 0' })).toEqual(0n);
      });
    });
  });

  given(
    '[case4] 🔴 a bill finer than milli, over a mid-size token count',
    () => {
      when('[t0] the amount saved is priced', () => {
        then('it prices the figure, and never throws', () => {
          // a small run bills at micro precision; a divisor in 100–999_999 made
          // `priceDivide` scale DOWN to milli, which it cannot, and it threw a
          // RangeError that killed `review._.cost --of tree` on the real grove.
          // full rate = $0.000_615 / 5_000 tokens; 4_000 cached at full rate
          // = $0.000_492, and the cache charged $0.000_049 for them
          const saved = getOneCacheSavedPrice({
            tokens: { input: 5_000, cacheGet: 4_000 },
            cost: { input: 'USD 0.000_615', cacheRead: 'USD 0.000_049' },
          });
          expect(saved).not.toBeNull();
          expect(
            asDeltaFrom({ of: saved!, expected: 'USD 0.000_443' }),
          ).toEqual(0n);
        });
      });
    },
  );

  given('[case3] 🔴 a run with NO full-rate token', () => {
    when('[t0] the amount saved is priced', () => {
      then('it is null — no measured rate exists to price against', () => {
        // a quotient over zero tokens is no rate; an invented one would state an
        // amount saved that no artifact measured
        const saved = getOneCacheSavedPrice({
          tokens: { input: 0, cacheGet: 900_000 },
          cost: { input: '$0', cacheRead: '$0.03' },
        });
        expect(saved).toBeNull();
      });
    });
  });
});
