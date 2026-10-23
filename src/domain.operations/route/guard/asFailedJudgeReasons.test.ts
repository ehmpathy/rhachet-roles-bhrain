import { asFailedJudgeReasons } from './asFailedJudgeReasons';

const TEST_CASES: Array<{
  description: string;
  given: { judges: Array<{ reason: string | null; index: number }> };
  expect: { output: string };
}> = [
  {
    description: 'renders no judges as an empty reason',
    given: { judges: [] },
    expect: { output: '' },
  },
  {
    description: "renders each judge's own reason, joined by a semicolon",
    given: {
      judges: [
        { reason: 'not approved', index: 1 },
        { reason: 'reviews hold', index: 2 },
      ],
    },
    expect: { output: 'not approved; reviews hold' },
  },
  {
    description: 'names the judge index where no reason was given',
    given: { judges: [{ reason: null, index: 3 }] },
    expect: { output: 'judge 3 failed' },
  },
];

describe('asFailedJudgeReasons', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asFailedJudgeReasons(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
