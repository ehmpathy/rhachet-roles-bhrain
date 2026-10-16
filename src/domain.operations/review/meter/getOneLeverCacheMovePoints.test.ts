import { getOneLeverCacheMovePoints } from './getOneLeverCacheMovePoints';

const TEST_CASES = [
  {
    description: 'an unchanged rate → zero points',
    given: { first: { cacheHitRate: 0.4 }, last: { cacheHitRate: 0.4 } },
    expect: 0,
  },
  {
    description: 'a rise from 0.25 to 0.75 → +50 points, never a ratio',
    given: { first: { cacheHitRate: 0.25 }, last: { cacheHitRate: 0.75 } },
    expect: 50,
  },
  {
    description: 'a fall from 0.5 to 0 → -50 points',
    given: { first: { cacheHitRate: 0.5 }, last: { cacheHitRate: 0 } },
    expect: -50,
  },
];

describe('getOneLeverCacheMovePoints', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneLeverCacheMovePoints(thisCase.given)).toBeCloseTo(
        thisCase.expect,
      );
    }),
  );
});
