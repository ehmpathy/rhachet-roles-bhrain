import {
  asIsoPrice,
  type IsoPrice,
  IsoPriceExponent,
  IsoPriceRoundMode,
  setPricePrecision,
} from 'iso-price';

import type { TokenPriceSum } from '@src/domain.objects/Reflector/TokenSpendReport';

import { asTokenPriceSum } from './asTokenPriceSum';

/**
 * .what = one part, priced on input only, or unpriced
 * .why = the subject is how known and absent prices add; one kind is enough to show it
 */
const genPart = (input: {
  price: string | null;
  unpricedTokens: number;
}): TokenPriceSum => {
  const price = input.price === null ? null : asIsoPrice(input.price);
  return {
    price,
    unpricedTokens: input.unpricedTokens,
    byKind: {
      input: price,
      output: null,
      cacheRead: null,
      cacheWrite5m: null,
      cacheWrite1h: null,
    },
  };
};

/**
 * .what = a price as canonical words at cent precision, or null
 * .why = two prices of equal value may differ in string precision; compare as the tree shows them
 */
const asCents = (input: { price: IsoPrice | null }): string | null =>
  input.price === null
    ? null
    : asIsoPrice(
        setPricePrecision(
          { of: input.price, to: IsoPriceExponent.CENTI },
          { round: IsoPriceRoundMode.HALF_UP },
        ),
      );

const TEST_CASES: {
  description: string;
  given: { parts: TokenPriceSum[] };
  expect: { price: string | null; unpricedTokens: number };
}[] = [
  {
    description: 'two priced parts → their prices add',
    given: {
      parts: [
        genPart({ price: 'USD 1.25', unpricedTokens: 0 }),
        genPart({ price: 'USD 2.50', unpricedTokens: 0 }),
      ],
    },
    expect: { price: 'USD 3.75', unpricedTokens: 0 },
  },
  {
    description:
      'a priced part beside an unpriced one → the price stands, the unpriced tokens carry',
    given: {
      parts: [
        genPart({ price: 'USD 1.25', unpricedTokens: 0 }),
        genPart({ price: null, unpricedTokens: 40 }),
      ],
    },
    expect: { price: 'USD 1.25', unpricedTokens: 40 },
  },
  {
    description: 'every part unpriced → the price is null, never a false $0',
    given: {
      parts: [
        genPart({ price: null, unpricedTokens: 10 }),
        genPart({ price: null, unpricedTokens: 30 }),
      ],
    },
    expect: { price: null, unpricedTokens: 40 },
  },
  {
    description: 'no parts → null price and zero unpriced',
    given: { parts: [] },
    expect: { price: null, unpricedTokens: 0 },
  },
];

describe('asTokenPriceSum', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const summed = asTokenPriceSum(thisCase.given);
      expect(asCents({ price: summed.price })).toEqual(thisCase.expect.price);
      expect(asCents({ price: summed.byKind.input })).toEqual(
        thisCase.expect.price,
      );
      expect(summed.byKind.output).toBeNull();
      expect(summed.unpricedTokens).toEqual(thisCase.expect.unpricedTokens);
    }),
  );
});
