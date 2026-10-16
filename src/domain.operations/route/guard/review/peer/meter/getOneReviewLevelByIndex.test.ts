import {
  getOneReviewLevelByIndex,
  LEVEL_OF_UNMAPPED_REVIEW,
} from './getOneReviewLevelByIndex';

const LEVELS = new Map<number, number>([
  [1, 1],
  [2, 2],
  [3, 3],
]);

const TEST_CASES = [
  {
    description: 'a mapped index reads its declared level',
    given: { index: 3 },
    expect: { level: 3 },
  },
  {
    description: 'an index the guard no longer declares reads the floor level',
    given: { index: 9 },
    expect: { level: LEVEL_OF_UNMAPPED_REVIEW },
  },
  {
    description: 'the no-marker index 0 reads the floor level',
    given: { index: 0 },
    expect: { level: 1 },
  },
];

describe('getOneReviewLevelByIndex', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        getOneReviewLevelByIndex({
          levels: LEVELS,
          index: thisCase.given.index,
        }),
      ).toEqual(thisCase.expect.level);
    }),
  );
});
