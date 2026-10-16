import { isReviewBoundSpent } from './isReviewBoundSpent';

const CLOCK = { msOfReviewStart: 1_000, brainCallTimeoutMs: 4_000 };

const TEST_CASES = [
  {
    description: 'time left in the lane bound → not spent',
    given: { msOfNow: 3_000 },
    expect: { output: false },
  },
  {
    description: 'exactly at the lane bound → spent',
    given: { msOfNow: 5_000 },
    expect: { output: true },
  },
  {
    description: 'past the lane bound → spent',
    given: { msOfNow: 9_000 },
    expect: { output: true },
  },
];

describe('isReviewBoundSpent', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        isReviewBoundSpent({ clock: CLOCK, msOfNow: thisCase.given.msOfNow }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
