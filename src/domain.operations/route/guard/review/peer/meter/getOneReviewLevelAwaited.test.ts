import { getOneReviewLevelAwaited } from './getOneReviewLevelAwaited';
import type { StoneGuardLevelClearance } from './getStoneGuardLevelClearance';

/**
 * .what = one clearance rung, with the defaults a plain level carries
 * .why = each case names only the level and whether it is clear
 */
const genRung = (input: {
  level: number;
  clearForUnlock: boolean;
}): StoneGuardLevelClearance => ({
  level: input.level,
  overruled: false,
  clearForUnlock: input.clearForUnlock,
  clearForPassage: input.clearForUnlock,
  hasQueued: false,
});

const TEST_CASES = [
  {
    description: 'a level held by l1 names l1',
    given: {
      clearance: [
        genRung({ level: 1, clearForUnlock: false }),
        genRung({ level: 3, clearForUnlock: false }),
      ],
      level: 3,
    },
    expect: { awaited: { level: 1 } },
  },
  {
    description: 'two held lower levels name the lowest',
    given: {
      clearance: [
        genRung({ level: 2, clearForUnlock: false }),
        genRung({ level: 1, clearForUnlock: false }),
      ],
      level: 3,
    },
    expect: { awaited: { level: 1 } },
  },
  {
    description: 'a clear l1 and a held l2 name l2',
    given: {
      clearance: [
        genRung({ level: 1, clearForUnlock: true }),
        genRung({ level: 2, clearForUnlock: false }),
      ],
      level: 3,
    },
    expect: { awaited: { level: 2 } },
  },
  {
    description: 'no held lower level answers null',
    given: {
      clearance: [
        genRung({ level: 1, clearForUnlock: true }),
        genRung({ level: 3, clearForUnlock: false }),
      ],
      level: 3,
    },
    expect: { awaited: null },
  },
];

describe('getOneReviewLevelAwaited', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneReviewLevelAwaited(thisCase.given)).toEqual(
        thisCase.expect.awaited,
      );
    }),
  );
});
