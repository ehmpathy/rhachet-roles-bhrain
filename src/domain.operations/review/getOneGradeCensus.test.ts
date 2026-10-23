import { CENSUS_NIL, getOneGradeCensus } from './getOneGradeCensus';

const TEST_CASES = [
  {
    description: 'no runs fold to the nil census',
    given: { runs: [] },
    expect: { output: CENSUS_NIL },
  },
  {
    description: 'each run counts once, under its own grade',
    given: {
      runs: [
        { grade: 'metered' as const },
        { grade: 'metered' as const },
        { grade: 'refused' as const },
        { grade: 'unknown' as const },
      ],
    },
    expect: { output: { metered: 2, refused: 1, unknown: 1 } },
  },
];

describe('getOneGradeCensus', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneGradeCensus({ runs: thisCase.given.runs })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
