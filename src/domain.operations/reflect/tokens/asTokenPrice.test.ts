import {
  asIsoPrice,
  type IsoPrice,
  IsoPriceExponent,
  IsoPriceRoundMode,
  setPricePrecision,
} from 'iso-price';

import { TokenRates } from '@src/domain.objects/Reflector/TokenRates';

import { asTokenPrice, type TokenCountsByKind } from './asTokenPrice';

/**
 * .what = rates of a round dollar per token, so each expected price reads at a glance
 * .why = the subject is which kinds are priced and which are not; the rate's size is not
 */
const genRates = (input: {
  absent: (keyof TokenCountsByKind)[];
}): TokenRates => {
  const rateOf = (kind: keyof TokenCountsByKind): IsoPrice | null =>
    input.absent.includes(kind) ? null : asIsoPrice('USD 1.00');
  return new TokenRates({
    model: 'claude-demo',
    input: rateOf('input'),
    output: rateOf('output'),
    cacheRead: rateOf('cacheRead'),
    cacheWrite5m: rateOf('cacheWrite5m'),
    cacheWrite1h: rateOf('cacheWrite1h'),
  });
};

/**
 * .what = a price as canonical words at cent precision
 * .why = two prices of equal value may differ in string precision; compare as the tree shows them
 */
const asCents = (input: { price: IsoPrice }): string =>
  asIsoPrice(
    setPricePrecision(
      { of: input.price, to: IsoPriceExponent.CENTI },
      { round: IsoPriceRoundMode.HALF_UP },
    ),
  );

const TOKENS: TokenCountsByKind = {
  input: 1,
  output: 2,
  cacheRead: 3,
  cacheWrite5m: 4,
  cacheWrite1h: 5,
};

const TEST_CASES: {
  description: string;
  given: { tokens: TokenCountsByKind; rates: TokenRates | null };
  expect: { price: string | null; unpricedTokens: number };
}[] = [
  {
    description: 'every rate known → every token priced, none unpriced',
    given: { tokens: TOKENS, rates: genRates({ absent: [] }) },
    expect: { price: 'USD 15.00', unpricedTokens: 0 },
  },
  {
    description:
      'the 1h write rate absent → its tokens are unpriced, the rest still priced',
    given: { tokens: TOKENS, rates: genRates({ absent: ['cacheWrite1h'] }) },
    expect: { price: 'USD 10.00', unpricedTokens: 5 },
  },
  {
    description: 'no spec for the model → no price at all, never a false $0',
    given: { tokens: TOKENS, rates: null },
    expect: { price: null, unpricedTokens: 15 },
  },
  {
    description:
      'an absent rate on a kind with zero tokens → naught is unpriced',
    given: {
      tokens: { ...TOKENS, cacheWrite1h: 0 },
      rates: genRates({ absent: ['cacheWrite1h'] }),
    },
    expect: { price: 'USD 10.00', unpricedTokens: 0 },
  },
  {
    description:
      'only unpriced kinds hold tokens → the price is null, not the zero of the priced kinds',
    given: {
      tokens: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite5m: 0,
        cacheWrite1h: 7,
      },
      rates: genRates({ absent: ['cacheWrite1h'] }),
    },
    expect: { price: null, unpricedTokens: 7 },
  },
];

describe('asTokenPrice', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const priced = asTokenPrice(thisCase.given);
      expect(priced.unpricedTokens).toEqual(thisCase.expect.unpricedTokens);
      if (thisCase.expect.price === null) {
        expect(priced.price).toBeNull();
        return;
      }
      expect(priced.price).not.toBeNull();
      expect(asCents({ price: priced.price! })).toEqual(
        asCents({ price: asIsoPrice(thisCase.expect.price) }),
      );
    }),
  );
});
