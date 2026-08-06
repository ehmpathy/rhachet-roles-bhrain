import { isLevelOverruled } from './isLevelOverruled';
import { JUDGE_LEVEL } from './JUDGE_LEVEL';

/**
 * .what = unit cases for isLevelOverruled — the atomic "is this level waved through" check.
 * .why = this one predicate replaced ~4 hand-written copies; pin its truth condition (the level
 *        sits in overruledLevels). the judge is the top rung (JUDGE_LEVEL), so a judge overrule
 *        is just JUDGE_LEVEL in the set — no stone-wide marker.
 */
const CASES: Array<{
  description: string;
  given: {
    level: number;
    overruledLevels: Set<number>;
  };
  expect: boolean;
}> = [
  {
    description: 'level in overruledLevels → true',
    given: { level: 1, overruledLevels: new Set([1]) },
    expect: true,
  },
  {
    description: 'level NOT in overruledLevels → false',
    given: { level: 3, overruledLevels: new Set([1]) },
    expect: false,
  },
  {
    description: 'level absent from a populated set → false',
    given: { level: 2, overruledLevels: new Set([1, 3]) },
    expect: false,
  },
  {
    description: 'judge rung in overruledLevels → true',
    given: { level: JUDGE_LEVEL, overruledLevels: new Set([JUDGE_LEVEL]) },
    expect: true,
  },
  {
    description: 'empty overruledLevels → false',
    given: { level: 1, overruledLevels: new Set() },
    expect: false,
  },
];

describe('isLevelOverruled', () => {
  CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const result = isLevelOverruled({
        level: thisCase.given.level,
        overruledLevels: thisCase.given.overruledLevels,
      });
      expect(result).toEqual(thisCase.expect);
    }),
  );
});
