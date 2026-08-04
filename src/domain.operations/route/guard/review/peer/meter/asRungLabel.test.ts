import { asRungLabel } from './asRungLabel';
import { JUDGE_LEVEL } from './JUDGE_LEVEL';

/**
 * .what = unit cases for asRungLabel — the human label for a guard-ladder rung.
 * .why = a human must never see the raw JUDGE_LEVEL sentinel; pin that a real peer level reads
 *        `level N` and the judge rung reads `judge`, never its Number.MAX_SAFE_INTEGER value.
 */
const CASES: Array<{
  description: string;
  given: { level: number };
  expect: string;
}> = [
  {
    description: 'peer level 1 → "level 1"',
    given: { level: 1 },
    expect: 'level 1',
  },
  {
    description: 'peer level 3 → "level 3"',
    given: { level: 3 },
    expect: 'level 3',
  },
  {
    description: 'judge rung (JUDGE_LEVEL) → "judge", not the sentinel number',
    given: { level: JUDGE_LEVEL },
    expect: 'judge',
  },
];

describe('asRungLabel', () => {
  CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const result = asRungLabel(thisCase.given.level);
      expect(result).toEqual(thisCase.expect);
    }),
  );

  test('the judge label never leaks the raw sentinel number', () => {
    expect(asRungLabel(JUDGE_LEVEL)).not.toContain(String(JUDGE_LEVEL));
  });
});
