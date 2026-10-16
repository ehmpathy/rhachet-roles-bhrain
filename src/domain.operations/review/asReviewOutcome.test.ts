import { asReviewOutcome } from './asReviewOutcome';

const TEST_CASES: Array<{
  description: string;
  given: { blockersCount: number; nitpicksCount: number };
  expect: { output: ReturnType<typeof asReviewOutcome> };
}> = [
  {
    description: 'a blocker holds the review, whatever the nitpicks',
    given: { blockersCount: 1, nitpicksCount: 3 },
    expect: { output: 'blocked' },
  },
  {
    description: 'nitpicks alone grade as a note, never as clear',
    given: { blockersCount: 0, nitpicksCount: 1 },
    expect: { output: 'nitpicked' },
  },
  {
    description: 'naught found grades as clear',
    given: { blockersCount: 0, nitpicksCount: 0 },
    expect: { output: 'clear' },
  },
];

describe('asReviewOutcome', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asReviewOutcome(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
