import { given, then, when } from 'test-fns';

import { isValidStoneName } from './isValidStoneName';

describe('isValidStoneName', () => {
  given(
    '[case1] valid stone names with numeric prefix and alpha segment',
    () => {
      when('[t0] name is 3.1.6.research.custom', () => {
        then('returns valid', () => {
          const result = isValidStoneName({ name: '3.1.6.research.custom' });
          expect(result).toEqual({ valid: true, reason: null });
        });
      });

      when('[t1] name is 5.2.evaluation', () => {
        then('returns valid', () => {
          const result = isValidStoneName({ name: '5.2.evaluation' });
          expect(result).toEqual({ valid: true, reason: null });
        });
      });

      when('[t2] name is 1.vision', () => {
        then('returns valid', () => {
          const result = isValidStoneName({ name: '1.vision' });
          expect(result).toEqual({ valid: true, reason: null });
        });
      });

      when('[t3] name is 3.3.1.blueprint.product', () => {
        then('returns valid', () => {
          const result = isValidStoneName({ name: '3.3.1.blueprint.product' });
          expect(result).toEqual({ valid: true, reason: null });
        });
      });
    },
  );

  given('[case2] invalid stone names without numeric prefix', () => {
    when('[t0] name is research', () => {
      then('returns invalid with reason', () => {
        const result = isValidStoneName({ name: 'research' });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('numeric prefix');
      });
    });

    when('[t1] name is vision.stone', () => {
      then('returns invalid with reason', () => {
        const result = isValidStoneName({ name: 'vision.stone' });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('numeric prefix');
      });
    });
  });

  given('[case3] invalid stone names without alpha segment', () => {
    when('[t0] name is 3.1.6', () => {
      then('returns invalid with reason', () => {
        const result = isValidStoneName({ name: '3.1.6' });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('alpha segment');
      });
    });

    when('[t1] name is 1', () => {
      then('returns invalid with reason', () => {
        const result = isValidStoneName({ name: '1' });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('alpha segment');
      });
    });

    when('[t2] name is 5.2.3.4', () => {
      then('returns invalid with reason', () => {
        const result = isValidStoneName({ name: '5.2.3.4' });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('alpha segment');
      });
    });
  });

  given('[case4] invalid stone names with empty or whitespace', () => {
    when('[t0] name is empty string', () => {
      then('returns invalid with reason', () => {
        const result = isValidStoneName({ name: '' });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('cannot be empty');
      });
    });

    when('[t1] name is whitespace only', () => {
      then('returns invalid with reason', () => {
        const result = isValidStoneName({ name: '   ' });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('cannot be empty');
      });
    });
  });
});
