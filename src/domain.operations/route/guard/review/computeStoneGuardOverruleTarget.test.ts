import { given, then, when } from 'test-fns';

import { computeStoneGuardOverruleTarget } from './computeStoneGuardOverruleTarget';
import { JUDGE_LEVEL } from './peer/meter/JUDGE_LEVEL';

describe('computeStoneGuardOverruleTarget', () => {
  given('[case1] a judges-only stone (the judge rung is active)', () => {
    when('[t0] activeLevel is JUDGE_LEVEL', () => {
      const result = computeStoneGuardOverruleTarget({
        activeLevel: JUDGE_LEVEL,
        owedLevels: [],
      });

      then('hasTarget is true (the judge rung is the target)', () => {
        expect(result.hasTarget).toEqual(true);
      });
      then('levelToOverrule is the judge rung', () => {
        expect(result.levelToOverrule).toEqual(JUDGE_LEVEL);
      });
    });
  });

  given('[case2] a leveled stone with a blocked active level', () => {
    when('[t0] activeLevel is 3', () => {
      const result = computeStoneGuardOverruleTarget({
        activeLevel: 3,
        owedLevels: [],
      });

      then('hasTarget is true', () => {
        expect(result.hasTarget).toEqual(true);
      });
      then('levelToOverrule is the active level', () => {
        expect(result.levelToOverrule).toEqual(3);
      });
    });
  });

  given(
    '[case3] a leveled stone, no active level, an owed contemplation',
    () => {
      when('[t0] activeLevel null, owedLevels [3]', () => {
        const result = computeStoneGuardOverruleTarget({
          activeLevel: null,
          owedLevels: [3],
        });

        then('hasTarget is true (the owed contemplation is the target)', () => {
          expect(result.hasTarget).toEqual(true);
        });
        then('levelToOverrule is the owed level', () => {
          expect(result.levelToOverrule).toEqual(3);
        });
      });
    },
  );

  given(
    '[case4] a leveled stone, no active level, multiple owed levels',
    () => {
      when('[t0] activeLevel null, owedLevels [5, 2, 3]', () => {
        const result = computeStoneGuardOverruleTarget({
          activeLevel: null,
          owedLevels: [5, 2, 3],
        });

        then('levelToOverrule is the LOWEST owed level', () => {
          expect(result.levelToOverrule).toEqual(2);
        });
      });
    },
  );

  given('[case5] a merit-clear leveled stone (no target left)', () => {
    when('[t0] activeLevel null, no owed contemplation', () => {
      const result = computeStoneGuardOverruleTarget({
        activeLevel: null,
        owedLevels: [],
      });

      then('hasTarget is false (no target to forgive → caller no-ops)', () => {
        expect(result.hasTarget).toEqual(false);
      });
      then('levelToOverrule is undefined (never a false fallback)', () => {
        expect(result.levelToOverrule).toBeUndefined();
      });
    });
  });

  given('[case6] the active level takes precedence over owed levels', () => {
    when('[t0] activeLevel 1 while owedLevels [3] also present', () => {
      const result = computeStoneGuardOverruleTarget({
        activeLevel: 1,
        owedLevels: [3],
      });

      then('levelToOverrule is the active level, not the owed one', () => {
        expect(result.levelToOverrule).toEqual(1);
      });
    });
  });
});
