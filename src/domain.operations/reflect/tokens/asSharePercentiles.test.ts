import { asSharePercentiles } from './asSharePercentiles';

const TEST_CASES = [
  {
    description: 'no shares → null',
    given: { shares: [] as number[] },
    expect: { output: null },
  },
  {
    description: 'one share → every percentile is that share',
    given: { shares: [0.4] },
    expect: { output: { p10: 0.4, p50: 0.4, p90: 0.4 } },
  },
  {
    description: 'ten shares out of order → nearest rank of the sorted list',
    given: { shares: [0.9, 0.1, 0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 1.0] },
    expect: { output: { p10: 0.1, p50: 0.5, p90: 0.9 } },
  },
  {
    description: 'two shares → p10 and p50 take the lower, p90 the upper',
    given: { shares: [0.6, 0.2] },
    expect: { output: { p10: 0.2, p50: 0.2, p90: 0.6 } },
  },
];

describe('asSharePercentiles', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asSharePercentiles(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
