import { computeReviewTotals } from './computeReviewTotals';

const TEST_CASES = [
  {
    description: 'no verdicts sum to zero',
    given: { verdicts: [] },
    expect: { output: { totalBlockers: 0, totalNitpicks: 0 } },
  },
  {
    description: 'one verdict passes through',
    given: { verdicts: [{ blockers: 2, nitpicks: 3 }] },
    expect: { output: { totalBlockers: 2, totalNitpicks: 3 } },
  },
  {
    description: 'many verdicts sum per dimension',
    given: {
      verdicts: [
        { blockers: 1, nitpicks: 0 },
        { blockers: 0, nitpicks: 4 },
        { blockers: 3, nitpicks: 1 },
      ],
    },
    expect: { output: { totalBlockers: 4, totalNitpicks: 5 } },
  },
];

describe('computeReviewTotals', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(computeReviewTotals(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
