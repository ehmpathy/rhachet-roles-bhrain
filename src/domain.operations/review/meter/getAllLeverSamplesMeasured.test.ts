import { getAllLeverSamplesMeasured } from './getAllLeverSamplesMeasured';

const TEST_CASES = [
  {
    description: 'an empty series → no measured samples',
    given: { series: [] },
    expect: [],
  },
  {
    description: 'a sample with no metered run is dropped',
    given: { series: [{ metered: 0, cacheHitRate: 0.5 }] },
    expect: [],
  },
  {
    description: 'a sample with no hit rate is dropped',
    given: { series: [{ metered: 3, cacheHitRate: null }] },
    expect: [],
  },
  {
    description:
      'measured samples are kept in order, a zero rate among them (a zero is measured)',
    given: {
      series: [
        { metered: 2, cacheHitRate: 0 },
        { metered: 0, cacheHitRate: null },
        { metered: 1, cacheHitRate: 0.42 },
      ],
    },
    expect: [
      { metered: 2, cacheHitRate: 0 },
      { metered: 1, cacheHitRate: 0.42 },
    ],
  },
];

describe('getAllLeverSamplesMeasured', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllLeverSamplesMeasured(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});
