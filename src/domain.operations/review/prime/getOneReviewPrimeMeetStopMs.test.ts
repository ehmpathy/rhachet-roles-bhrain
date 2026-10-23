import { getOneReviewPrimeMeetStopMs } from './getOneReviewPrimeMeetStopMs';

const TEST_CASES = [
  {
    description:
      'the meet stops at half the default bound, past its own windows',
    given: { msOfReviewStart: 1_000, brainCallTimeoutMs: 21 * 60_000 },
    expect: { output: 1_000 + 10.5 * 60_000 },
  },
  {
    description:
      'a short bound a human set shrinks the meet with it, so the brain call keeps half',
    given: { msOfReviewStart: 1_000, brainCallTimeoutMs: 6_000 },
    expect: { output: 4_000 },
  },
  {
    description: 'an odd bound floors to a whole millisecond',
    given: { msOfReviewStart: 0, brainCallTimeoutMs: 5 },
    expect: { output: 2 },
  },
];

describe('getOneReviewPrimeMeetStopMs', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneReviewPrimeMeetStopMs(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
