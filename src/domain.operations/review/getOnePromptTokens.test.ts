import { getOnePromptTokens } from './getOnePromptTokens';

/**
 * .what = data-driven cases for getOnePromptTokens
 * .why = it is the denominator of every cache share; a dropped axis would raise each
 *        share with no figure visibly wrong
 */
const CASES: {
  description: string;
  tokens: { input: number; cacheSet: number; cacheGet: number };
  expected: number;
}[] = [
  {
    description: 'all three axes sum',
    tokens: { input: 10, cacheSet: 20, cacheGet: 30 },
    expected: 60,
  },
  {
    description: 'all zero → zero',
    tokens: { input: 0, cacheSet: 0, cacheGet: 0 },
    expected: 0,
  },
  {
    description: 'a cache write alone still counts',
    tokens: { input: 0, cacheSet: 7, cacheGet: 0 },
    expected: 7,
  },
];

describe('getOnePromptTokens', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(getOnePromptTokens({ tokens: thisCase.tokens })).toEqual(
        thisCase.expected,
      );
    }),
  );
});
