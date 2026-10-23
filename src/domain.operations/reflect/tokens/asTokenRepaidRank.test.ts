import { asIsoPrice } from 'iso-price';

import type { TokenSpendRepaidRow } from '@src/domain.objects/Reflector/TokenSpendReport';

import { asTokenRepaidRank } from './asTokenRepaidRank';

/**
 * .what = a repaid row with a given price and token total
 */
const genRow = (input: {
  label: string;
  price: string | null;
  tokens: number;
  unpricedTokens: number;
}): TokenSpendRepaidRow => {
  const price = input.price === null ? null : asIsoPrice(input.price);
  return genRowPriced({ ...input, price });
};

/**
 * .what = the row itself, once its price is cast into the glossary
 */
const genRowPriced = (input: {
  label: string;
  price: ReturnType<typeof asIsoPrice> | null;
  tokens: number;
  unpricedTokens: number;
}): TokenSpendRepaidRow => ({
  category: 'tool.result',
  label: input.label,
  tokens: {
    cacheRead: input.tokens,
    cacheWrite5m: 0,
    cacheWrite1h: 0,
    input: 0,
  },
  priced: {
    price: input.price,
    unpricedTokens: input.unpricedTokens,
    byKind: {
      input: null,
      output: null,
      cacheRead: input.price,
      cacheWrite5m: null,
      cacheWrite1h: null,
    },
  },
  peak: null,
});

const TEST_CASES = [
  {
    description:
      'every row priced → price ranks, so a dear write outranks a cheap read',
    given: {
      repaid: [
        genRow({
          label: 'read',
          price: 'USD 0.01',
          tokens: 90_000,
          unpricedTokens: 0,
        }),
        genRow({
          label: 'write',
          price: 'USD 0.06',
          tokens: 10_000,
          unpricedTokens: 0,
        }),
      ],
    },
    expect: { rankedBy: 'price', order: ['write', 'read'] },
  },
  {
    description: 'one row unpriced → tokens rank, never a guessed price',
    given: {
      repaid: [
        genRow({
          label: 'read',
          price: 'USD 0.01',
          tokens: 90_000,
          unpricedTokens: 0,
        }),
        genRow({
          label: 'opaque',
          price: null,
          tokens: 10_000,
          unpricedTokens: 10_000,
        }),
      ],
    },
    expect: { rankedBy: 'tokens', order: ['read', 'opaque'] },
  },
  {
    description: 'a row partly unpriced → tokens rank',
    given: {
      repaid: [
        genRow({
          label: 'small',
          price: 'USD 0.50',
          tokens: 1_000,
          unpricedTokens: 5,
        }),
        genRow({
          label: 'large',
          price: 'USD 0.01',
          tokens: 9_000,
          unpricedTokens: 0,
        }),
      ],
    },
    expect: { rankedBy: 'tokens', order: ['large', 'small'] },
  },
  {
    description:
      'rows priced at different exponents → each scales by its own, so a micro-scaled dear row outranks a centi-scaled cheap one',
    given: {
      repaid: [
        genRow({
          label: 'cheap-centi',
          price: 'USD 0.01',
          tokens: 90_000,
          unpricedTokens: 0,
        }),
        genRow({
          label: 'dear-micro',
          price: 'USD 0.050_000',
          tokens: 10_000,
          unpricedTokens: 0,
        }),
      ],
    },
    expect: { rankedBy: 'price', order: ['dear-micro', 'cheap-centi'] },
  },
] as const;

const MEASURE_CASES = [
  { description: 'a centi price → its value', price: 'USD 0.06', value: 0.06 },
  {
    description: 'a micro price → its value',
    price: 'USD 0.000_500',
    value: 0.0005,
  },
  {
    description: 'a whole price (exponent x10^0) → its value, never zero',
    price: 'JPY 1200',
    value: 1200,
  },
] as const;

describe('asTokenRepaidRank', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const repaid = [...thisCase.given.repaid];
      const { rankedBy, measure } = asTokenRepaidRank({ repaid });
      expect(rankedBy).toEqual(thisCase.expect.rankedBy);
      const order = [...repaid]
        .sort((a, b) => measure(b) - measure(a))
        .map((row) => row.label);
      expect(order).toEqual(thisCase.expect.order);
    }),
  );

  MEASURE_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const row = genRow({
        label: 'only',
        price: thisCase.price,
        tokens: 1_000,
        unpricedTokens: 0,
      });
      const { rankedBy, measure } = asTokenRepaidRank({ repaid: [row] });
      expect(rankedBy).toEqual('price');
      expect(measure(row)).toBeCloseTo(thisCase.value, 9);
    }),
  );
});
