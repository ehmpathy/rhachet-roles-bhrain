import { getAllReviewMalfunctions } from './getAllReviewMalfunctions';

const TEST_CASES: Array<{
  description: string;
  given: {
    reviews: Array<{ exitClass: string; index: number }>;
    overruled: number[];
  };
  expect: { indexes: number[] };
}> = [
  {
    description: 'keeps a malfunction at a level not overruled',
    given: { reviews: [{ exitClass: 'malfunction', index: 1 }], overruled: [] },
    expect: { indexes: [1] },
  },
  {
    description: 'drops a malfunction at an overruled level',
    given: {
      reviews: [{ exitClass: 'malfunction', index: 1 }],
      overruled: [1],
    },
    expect: { indexes: [] },
  },
  {
    description: 'drops a lane that did not malfunction',
    given: {
      reviews: [
        { exitClass: 'passed', index: 1 },
        { exitClass: 'constraint', index: 2 },
      ],
      overruled: [],
    },
    expect: { indexes: [] },
  },
];

describe('getAllReviewMalfunctions', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = getAllReviewMalfunctions({
        reviews: thisCase.given.reviews,
        isLevelOverruled: (index) => thisCase.given.overruled.includes(index),
      });
      expect(output.map((review) => review.index)).toEqual(
        thisCase.expect.indexes,
      );
    }),
  );
});
