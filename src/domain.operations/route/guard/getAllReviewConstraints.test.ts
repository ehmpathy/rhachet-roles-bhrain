import { getAllReviewConstraints } from './getAllReviewConstraints';

const TEST_CASES: Array<{
  description: string;
  given: {
    reviews: Array<{ exitClass: string; blockers: number; index: number }>;
    overruled: number[];
  };
  expect: { indexes: number[] };
}> = [
  {
    description:
      'keeps a constraint with zero blockers at a level not overruled',
    given: {
      reviews: [{ exitClass: 'constraint', blockers: 0, index: 1 }],
      overruled: [],
    },
    expect: { indexes: [1] },
  },
  {
    description:
      'drops a constraint exit that carries blockers (a review that found issues)',
    given: {
      reviews: [{ exitClass: 'constraint', blockers: 2, index: 1 }],
      overruled: [],
    },
    expect: { indexes: [] },
  },
  {
    description: 'drops a constraint at an overruled level',
    given: {
      reviews: [{ exitClass: 'constraint', blockers: 0, index: 1 }],
      overruled: [1],
    },
    expect: { indexes: [] },
  },
  {
    description: 'drops a lane that is no constraint',
    given: {
      reviews: [{ exitClass: 'malfunction', blockers: 0, index: 1 }],
      overruled: [],
    },
    expect: { indexes: [] },
  },
];

describe('getAllReviewConstraints', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = getAllReviewConstraints({
        reviews: thisCase.given.reviews,
        isLevelOverruled: (index) => thisCase.given.overruled.includes(index),
      });
      expect(output.map((review) => review.index)).toEqual(
        thisCase.expect.indexes,
      );
    }),
  );
});
