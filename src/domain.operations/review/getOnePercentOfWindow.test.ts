import { getOnePercentOfWindow } from './getOnePercentOfWindow';

const TEST_CASES = [
  {
    description: 'a quarter of the window is 25 percent',
    given: { tokens: 250_000, window: 1_000_000 },
    expect: { output: 25 },
  },
  {
    description: 'the figure stays unrounded for the gates',
    given: { tokens: 1, window: 8 },
    expect: { output: 12.5 },
  },
  {
    description: 'an empty prompt fills none of the window',
    given: { tokens: 0, window: 1_000_000 },
    expect: { output: 0 },
  },
];

describe('getOnePercentOfWindow', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOnePercentOfWindow(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
