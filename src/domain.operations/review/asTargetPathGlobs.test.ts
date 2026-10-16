import { given, then, when } from 'test-fns';

import { asTargetPathGlobs } from './asTargetPathGlobs';

describe('asTargetPathGlobs', () => {
  given('[case1] no path flag was passed at all', () => {
    when('[t0] the pair is cast', () => {
      then('both halves are empty', () => {
        expect(
          asTargetPathGlobs({
            paths: undefined,
            pathsWith: undefined,
            pathsWout: undefined,
          }),
        ).toEqual({ positive: [], negative: [] });
      });
    });
  });

  given('[case2] the two single-sense flags carry one glob each', () => {
    when('[t0] the pair is cast', () => {
      then('each lands on its own side', () => {
        expect(
          asTargetPathGlobs({
            paths: undefined,
            pathsWith: 'src/**/*.ts',
            pathsWout: '**/*.test.ts',
          }),
        ).toEqual({
          positive: ['src/**/*.ts'],
          negative: ['**/*.test.ts'],
        });
      });
    });
  });

  /**
   * .why the `!` prefix earns a case of its own — it is the one input that
   * must land on a side the flag name does not name. `--paths` is the legacy
   * two-sense flag, so `!x` arrives on the same flag as `x` and must sort to
   * the opposite list. a cast that reads the flag name alone puts every
   * exclusion into `positive`, which inverts it: the lane then reviews
   * exactly the files a driver asked it to skip — a wrong review, not merely
   * a thin one.
   */
  given('[case3] the legacy --paths flag carries both senses', () => {
    const globs = asTargetPathGlobs({
      paths: ['src/**/*.ts', '!src/**/*.test.ts'],
      pathsWith: undefined,
      pathsWout: undefined,
    });

    when('[t0] the pair is cast', () => {
      then('the un-prefixed glob sorts positive', () => {
        expect(globs.positive).toEqual(['src/**/*.ts']);
      });

      then('🔴 the `!` glob sorts NEGATIVE, with its marker stripped', () => {
        expect(globs.negative).toEqual(['src/**/*.test.ts']);
      });
    });
  });

  given('[case4] a legacy flag and a single-sense flag are both passed', () => {
    const globs = asTargetPathGlobs({
      paths: ['src/**/*.ts', '!src/**/*.test.ts'],
      pathsWith: 'blackbox/**/*.ts',
      pathsWout: '**/__snapshots__/**',
    });

    when('[t0] the pair is cast', () => {
      /**
       * 🔴 the ORDER is asserted, not merely the membership. the legacy flag's
       * globs lead on each side, and `getAllTargetsAskedForByName` reads this
       * list positionally — so a swap reorders what a by-name exemption sees.
       */
      then('the legacy globs lead each side', () => {
        expect(globs.positive).toEqual(['src/**/*.ts', 'blackbox/**/*.ts']);
        expect(globs.negative).toEqual([
          'src/**/*.test.ts',
          '**/__snapshots__/**',
        ]);
      });
    });
  });

  given('[case5] only exclusions were passed on the legacy flag', () => {
    const globs = asTargetPathGlobs({
      paths: '!**/*.snap',
      pathsWith: undefined,
      pathsWout: undefined,
    });

    when('[t0] the pair is cast', () => {
      /**
       * 🔴 an empty `positive` carries weight: `getAllTargetsJoined` reads
       * `positive.length > 0` as `pathsRequested`. a cast that leaked the `!`
       * glob into `positive` would flip that flag and widen the scope to a
       * full path join, for a driver who asked only to EXCLUDE.
       */
      then('positive stays empty, so the join stays diffs-only', () => {
        expect(globs.positive).toEqual([]);
      });

      then('the exclusion is carried, marker stripped', () => {
        expect(globs.negative).toEqual(['**/*.snap']);
      });
    });
  });
});
