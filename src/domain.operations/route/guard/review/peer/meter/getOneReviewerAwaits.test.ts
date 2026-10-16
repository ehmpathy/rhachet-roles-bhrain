import { getOneReviewerAwaits } from './getOneReviewerAwaits';

const clear = (clearForUnlock: boolean) => ({ clearForUnlock });

const TEST_CASES = [
  {
    description: 'a level-1 reviewer never awaits',
    given: { level: 1, levelsPoured: [], clearance: [] },
    expect: false,
  },
  {
    description: 'a level whose lower levels are all clear awaits none',
    given: {
      level: 3,
      levelsPoured: [],
      clearance: [
        [1, clear(true)],
        [2, clear(true)],
      ],
    },
    expect: false,
  },
  {
    description: 'a level awaits the FIRST lower level not yet clear',
    given: {
      level: 3,
      levelsPoured: [],
      clearance: [
        [1, clear(false)],
        [2, clear(false)],
      ],
    },
    expect: { level: 1 },
  },
  {
    description: 'a lower level with no reviewers reads as clear',
    given: { level: 3, levelsPoured: [], clearance: [[2, clear(false)]] },
    expect: { level: 2 },
  },
  {
    description:
      'a level that already poured never awaits, whatever the ladder says',
    given: { level: 3, levelsPoured: [3], clearance: [[1, clear(false)]] },
    expect: false,
  },
] as const;

describe('getOneReviewerAwaits', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const result = getOneReviewerAwaits({
        level: thisCase.given.level,
        levelsPoured: new Set<number>(thisCase.given.levelsPoured),
        clearanceByLevel: new Map<number, { clearForUnlock: boolean }>(
          thisCase.given.clearance.map(([level, c]) => [level, c]),
        ),
      });
      expect(result).toEqual(thisCase.expect);
    }),
  );
});
