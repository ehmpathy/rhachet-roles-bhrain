import { UnexpectedCodePathError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { getAllTargetsOfPartition } from './getAllTargetsOfPartition';

describe('getAllTargetsOfPartition', () => {
  given('[case1] a partition with common and narrow targets', () => {
    when('[t0] its targets are ordered', () => {
      const ordered = getAllTargetsOfPartition({
        targets: ['src/n1.ts', 'src/c2.ts', 'src/n2.ts', 'src/c1.ts'],
        partition: {
          name: 'src',
          common: ['src/c1.ts', 'src/c2.ts'],
          narrow: ['src/n1.ts', 'src/n2.ts'],
        },
      });

      then(
        "🔴 common leads, in the split's order; narrow trails, in the run's order",
        () => {
          expect(ordered).toEqual([
            'src/c1.ts',
            'src/c2.ts',
            'src/n1.ts',
            'src/n2.ts',
          ]);
        },
      );
    });
  });

  /**
   * .what = 🔴 CLAMP. a planned target that the scope given does not hold
   * .why = the plan and the scope are one settled walk, so a gap between them is a defect in
   *        our own code. it was once filtered silently, and the merged report still stated the
   *        plan's target count — a reviewer "graded" a file it never saw
   */
  given('[case2] a common target the scope no longer carries', () => {
    when('[t0] its targets are ordered', () => {
      then('it throws, and names the partition and the absent target', () => {
        const error = getError(() =>
          getAllTargetsOfPartition({
            targets: ['src/n1.ts'],
            partition: {
              name: 'src',
              common: ['src/gone.ts'],
              narrow: ['src/n1.ts'],
            },
          }),
        );
        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect(error.message).toContain(
          'a partition plans a target its settled scope does not hold',
        );
        expect(error.message).toContain('src/gone.ts');
      });
    });
  });

  given('[case3] a narrow target the scope no longer carries', () => {
    when('[t0] its targets are ordered', () => {
      then('it throws, never filters', () => {
        const error = getError(() =>
          getAllTargetsOfPartition({
            targets: ['src/c1.ts'],
            partition: {
              name: 'src',
              common: ['src/c1.ts'],
              narrow: ['src/gone.ts'],
            },
          }),
        );
        expect(error).toBeInstanceOf(UnexpectedCodePathError);
        expect(error.message).toContain('src/gone.ts');
      });
    });
  });

  given('[case4] a whole run, no partition', () => {
    when('[t0] its targets are ordered', () => {
      then('the run order stands', () => {
        expect(
          getAllTargetsOfPartition({
            targets: ['b.ts', 'a.ts'],
            partition: null,
          }),
        ).toEqual(['b.ts', 'a.ts']);
      });
    });
  });
});
