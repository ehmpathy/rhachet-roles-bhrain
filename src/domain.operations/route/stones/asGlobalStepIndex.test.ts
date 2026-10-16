import { asGlobalStepIndex } from './asGlobalStepIndex';

const TEST_CASES = [
  {
    description: 'the first review step is position 0',
    given: { step: { phase: 'review' as const, index: 0 }, totalReviews: 3 },
    expect: { output: 0 },
  },
  {
    description: 'a review step keeps its own index',
    given: { step: { phase: 'review' as const, index: 2 }, totalReviews: 3 },
    expect: { output: 2 },
  },
  {
    description: 'the first judge step sits after every review',
    given: { step: { phase: 'judge' as const, index: 0 }, totalReviews: 3 },
    expect: { output: 3 },
  },
  {
    description: 'a later judge step is offset by the review count',
    given: { step: { phase: 'judge' as const, index: 1 }, totalReviews: 3 },
    expect: { output: 4 },
  },
  {
    description: 'with no reviews, a judge step keeps its own index',
    given: { step: { phase: 'judge' as const, index: 1 }, totalReviews: 0 },
    expect: { output: 1 },
  },
];

describe('asGlobalStepIndex', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asGlobalStepIndex(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
