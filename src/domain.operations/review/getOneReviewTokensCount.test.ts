import { getOneReviewTokensCount } from './getOneReviewTokensCount';

const TEST_CASES = [
  {
    description: 'sums the four disjoint axes',
    given: { tokens: { input: 10, cacheSet: 200, cacheGet: 3000, output: 4 } },
    expect: { output: 3214 },
  },
  {
    description: 'a run with no cache reads sums the rest',
    given: { tokens: { input: 7, cacheSet: 0, cacheGet: 0, output: 1 } },
    expect: { output: 8 },
  },
];

describe('getOneReviewTokensCount', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneReviewTokensCount(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
