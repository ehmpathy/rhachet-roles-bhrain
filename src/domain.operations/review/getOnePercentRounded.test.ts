import { getOnePercentRounded } from './getOnePercentRounded';

const TEST_CASES = [
  {
    description: 'rounds to one decimal place',
    given: { percent: 55.73412 },
    expect: { output: 55.7 },
  },
  {
    description: 'rounds a half up',
    given: { percent: 12.25 },
    expect: { output: 12.3 },
  },
  {
    description: 'leaves a whole percent whole',
    given: { percent: 40 },
    expect: { output: 40 },
  },
];

describe('getOnePercentRounded', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOnePercentRounded(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
