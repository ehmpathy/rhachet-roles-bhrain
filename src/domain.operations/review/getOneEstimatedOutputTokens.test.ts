import { getOneEstimatedOutputTokens } from './getOneEstimatedOutputTokens';

const TEST_CASES = [
  {
    description: 'a review is assumed to emit a tenth of what it reads',
    given: { tokens: 500_000 },
    expect: { output: 50_000 },
  },
  {
    description: 'the estimate is a whole token count',
    given: { tokens: 1_234 },
    expect: { output: 123 },
  },
  {
    description: 'an empty prompt emits none',
    given: { tokens: 0 },
    expect: { output: 0 },
  },
];

describe('getOneEstimatedOutputTokens', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneEstimatedOutputTokens(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
