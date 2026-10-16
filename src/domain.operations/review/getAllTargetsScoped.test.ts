import { given, then, when } from 'test-fns';

import { getAllTargetsScoped } from '@src/domain.operations/review/getAllTargetsScoped';

describe('getAllTargetsScoped', () => {
  given('[case1] no exclusion at all — the common invocation', () => {
    const targets = ['src/a.ts', 'src/b.ts'];

    when('[t0] the set is scoped', () => {
      const scoped = getAllTargetsScoped({ targets, excluded: [] });

      then('every target survives', () => {
        expect(scoped).toEqual(targets);
      });
    });
  });

  given('[case2] one exclusion that matches a subset', () => {
    const targets = [
      'src/a.ts',
      'src/a.test.ts',
      'src/deep/b.test.ts',
      'src/b.ts',
    ];

    when('[t0] the test corpus is excluded', () => {
      const scoped = getAllTargetsScoped({
        targets,
        excluded: ['**/*.test.ts'],
      });

      then('only the targets that match NO exclusion survive', () => {
        expect(scoped).toEqual(['src/a.ts', 'src/b.ts']);
      });

      then('the kept order is the order asked', () => {
        // 🔴 this carries weight: the corpus is sorted by cache stability upstream,
        //    so a reorder here would void that sort before the prompt is compiled
        expect(scoped[0]).toEqual('src/a.ts');
        expect(scoped[1]).toEqual('src/b.ts');
      });
    });
  });

  given(
    '[case3] two exclusions, and a target that matches only the second',
    () => {
      const targets = [
        'src/a.ts',
        'src/__snapshots__/a.snap',
        '.behavior/x.md',
      ];

      when('[t0] both are applied', () => {
        const scoped = getAllTargetsScoped({
          targets,
          excluded: ['**/__snapshots__/**', '.behavior/**'],
        });

        then('a match on EITHER glob drops the target', () => {
          // the predicate is a NONE-of, not a first-glob check — this case fails if
          // the fold ever collapses to a single glob
          expect(scoped).toEqual(['src/a.ts']);
        });
      });
    },
  );

  given('[case4] an exclusion that matches every target', () => {
    when('[t0] the set is scoped', () => {
      const scoped = getAllTargetsScoped({
        targets: ['src/a.ts', 'src/b.ts'],
        excluded: ['**/*.ts'],
      });

      then('the set is empty, and does not fall back to the input', () => {
        expect(scoped).toEqual([]);
      });
    });
  });
});
