import { getOnePrefixVerdict } from '@src/domain.operations/review/meter/getOnePrefixVerdict';

/**
 * .what = the tokens of a round, with the axes a case does not name set to zero
 * .why = each case below names only the axes its verdict turns on
 */
const asTokens = (input: { input: number; cacheGet: number }) => ({
  input: input.input,
  cacheSet: 0,
  cacheGet: input.cacheGet,
  output: 10,
});

const TEST_CASES = [
  {
    description: 'a shared prefix the cache read half of is served',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      tokens: asTokens({ input: 1_874, cacheGet: 626 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 626,
      reach: 626 / 1_250,
      verdict: 'served',
    },
  },
  {
    description: 'a shared prefix the cache served none of is missed',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 0,
      reach: 0,
      verdict: 'missed',
    },
  },
  {
    description: 'a run whose read covers its whole prompt is self-cached',
    given: {
      sharedChars: 5_000,
      promptChars: 10_000,
      tokens: asTokens({ input: 1, cacheGet: 2_499 }),
    },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: 2_499,
      reach: null,
      verdict: 'self-cached',
    },
  },
  {
    description: 'a read past the shared prefix is an over-reach',
    given: {
      sharedChars: 2_000,
      promptChars: 10_000,
      tokens: asTokens({ input: 1_500, cacheGet: 1_000 }),
    },
    expect: {
      expectedTokens: 500,
      detectedTokens: 1_000,
      reach: 2,
      verdict: 'over-reach',
    },
  },
  {
    description: 'a read with no shared prefix at all is an over-reach',
    given: {
      sharedChars: 0,
      promptChars: 10_000,
      tokens: asTokens({ input: 2_000, cacheGet: 500 }),
    },
    expect: {
      expectedTokens: 0,
      detectedTokens: 500,
      reach: null,
      verdict: 'over-reach',
    },
  },
  {
    description: 'no shared prefix and no read is unshared',
    given: {
      sharedChars: 0,
      promptChars: 10_000,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: 0,
      detectedTokens: 0,
      reach: null,
      verdict: 'unshared',
    },
  },
  {
    description:
      'an unmetered round has an expected read at the fallback ratio, and no verdict',
    given: { sharedChars: 5_000, promptChars: 10_000, tokens: null },
    expect: {
      expectedTokens: 1_250,
      detectedTokens: null,
      reach: null,
      verdict: null,
    },
  },
  {
    description: 'a prompt not on disk has no expected read, and no verdict',
    given: {
      sharedChars: null,
      promptChars: 10_000,
      tokens: asTokens({ input: 2_500, cacheGet: 0 }),
    },
    expect: {
      expectedTokens: null,
      detectedTokens: 0,
      reach: null,
      verdict: null,
    },
  },
];

describe('getOnePrefixVerdict', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOnePrefixVerdict(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
