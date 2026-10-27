import { type IsoPrice, priceSum } from 'iso-price';

import type {
  TokenPriceByKind,
  TokenPriceSum,
} from '@src/domain.objects/Reflector/TokenSpendReport';

/**
 * .what = adds price sums: the priced parts add, the unpriced token counts add
 * .why = a row, a transcript, and a corpus each sum parts priced at different models;
 *        a part with no price must not zero the total, nor be dropped from it
 */
export const asTokenPriceSum = (input: {
  parts: TokenPriceSum[];
}): TokenPriceSum => {
  // a kind's sum is null only when no part could price that kind
  const sumOfKind = (of: { kind: keyof TokenPriceByKind }): IsoPrice | null =>
    asPriceSumOrNull({
      prices: input.parts.map((part) => part.byKind[of.kind]),
    });

  return {
    price: asPriceSumOrNull({ prices: input.parts.map((part) => part.price) }),
    unpricedTokens: input.parts.reduce(
      (sum, part) => sum + part.unpricedTokens,
      0,
    ),
    byKind: {
      input: sumOfKind({ kind: 'input' }),
      output: sumOfKind({ kind: 'output' }),
      cacheRead: sumOfKind({ kind: 'cacheRead' }),
      cacheWrite5m: sumOfKind({ kind: 'cacheWrite5m' }),
      cacheWrite1h: sumOfKind({ kind: 'cacheWrite1h' }),
    },
  };
};

/**
 * .what = the sum of the known prices, or null when none is known
 * .why = an absent price must read as absent, never as $0
 */
const asPriceSumOrNull = (input: {
  prices: (IsoPrice | null)[];
}): IsoPrice | null => {
  const known = input.prices.filter(
    (price): price is IsoPrice => price !== null,
  );
  return known.length === 0 ? null : priceSum(...known);
};
