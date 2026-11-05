import { asCallContext } from './asCallContext';

const TEST_CASES = [
  {
    description: 'sums the three disjoint parts of a prompt',
    spend: {
      inputRaw: 5,
      cacheRead: 20_000,
      cacheWrite: { total: 1_000, ttl5m: 1_000, ttl1h: 0 },
      output: 300,
    },
    output: 21_005,
  },
  {
    description: 'output is never counted as context',
    spend: {
      inputRaw: 0,
      cacheRead: 0,
      cacheWrite: { total: 0, ttl5m: null, ttl1h: null },
      output: 9_999,
    },
    output: 0,
  },
  {
    description: 'reads the cache write total, whatever its ttl split',
    spend: {
      inputRaw: 1,
      cacheRead: 2,
      cacheWrite: { total: 30, ttl5m: null, ttl1h: null },
      output: 4,
    },
    output: 33,
  },
];

describe('asCallContext', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asCallContext({ call: { spend: thisCase.spend } })).toEqual(
        thisCase.output,
      );
    }),
  );
});
