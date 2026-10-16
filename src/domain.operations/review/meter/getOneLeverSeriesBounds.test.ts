import { getOneLeverSeriesBounds } from './getOneLeverSeriesBounds';

const TEST_CASES = [
  {
    description: 'an empty series → no bounds',
    given: { series: [] },
    expect: null,
  },
  {
    description: 'one measured sample → no bounds (one point bounds no move)',
    given: {
      series: [
        { metered: 1, cacheHitRate: 0.3 },
        { metered: 0, cacheHitRate: null },
      ],
    },
    expect: null,
  },
  {
    description: 'two measured samples → first and last',
    given: {
      series: [
        { metered: 1, cacheHitRate: 0.1 },
        { metered: 2, cacheHitRate: 0.4 },
      ],
    },
    expect: {
      first: { metered: 1, cacheHitRate: 0.1 },
      last: { metered: 2, cacheHitRate: 0.4 },
    },
  },
  {
    description:
      'unmeasured ends are skipped; the bounds are the measured ends',
    given: {
      series: [
        { metered: 0, cacheHitRate: null },
        { metered: 1, cacheHitRate: 0.1 },
        { metered: 4, cacheHitRate: 0.2 },
        { metered: 3, cacheHitRate: 0.6 },
        { metered: 5, cacheHitRate: null },
      ],
    },
    expect: {
      first: { metered: 1, cacheHitRate: 0.1 },
      last: { metered: 3, cacheHitRate: 0.6 },
    },
  },
];

describe('getOneLeverSeriesBounds', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneLeverSeriesBounds(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
