import { given, then, when } from 'test-fns';

import { getAllTargetsByCacheStability } from '@src/domain.operations/review/getAllTargetsByCacheStability';

describe('getAllTargetsByCacheStability', () => {
  given('[case1] a corpus whose files were touched at different times', () => {
    const targets = [
      { path: 'src/a.recent.ts', touchedAt: 3_000 },
      { path: 'src/m.ancient.ts', touchedAt: 1_000 },
      { path: 'src/z.midlife.ts', touchedAt: 2_000 },
    ];

    when('[t0] the corpus is ordered', () => {
      const ordered = getAllTargetsByCacheStability({ targets });

      then('the least recently touched leads', () => {
        expect(ordered).toEqual([
          'src/m.ancient.ts',
          'src/z.midlife.ts',
          'src/a.recent.ts',
        ]);
      });

      then('the order is NOT alphabetical', () => {
        // the case is built so stability and the alphabet disagree — otherwise it
        // would pass under the extant `.sort()` and prove naught
        expect(ordered).not.toEqual(targets.map((t) => t.path).sort());
      });
    });
  });

  given('[case2] a driver who repairs the file the reviewers flagged', () => {
    // the corpus as the prior round saw it
    const roundOne = [
      { path: 'src/stable.a.ts', touchedAt: 1_000 },
      { path: 'src/stable.b.ts', touchedAt: 2_000 },
      { path: 'src/churns.ts', touchedAt: 3_000 },
    ];

    when('[t0] the driver edits the file that already trailed', () => {
      // an edit stamps it newest; it was newest, so it stays newest
      const roundTwo = [
        { path: 'src/stable.a.ts', touchedAt: 1_000 },
        { path: 'src/stable.b.ts', touchedAt: 2_000 },
        { path: 'src/churns.ts', touchedAt: 9_000 },
      ];

      then('the order does not move at all', () => {
        // 🔴 the property the whole scheme rests on: a repair to the churned file
        //    leaves every stable file at its prior index, so the prefix over them
        //    survives intact into the next round
        expect(getAllTargetsByCacheStability({ targets: roundTwo })).toEqual(
          getAllTargetsByCacheStability({ targets: roundOne }),
        );
      });
    });

    when('[t1] the driver edits a file from the stable head', () => {
      const roundTwo = [
        { path: 'src/stable.a.ts', touchedAt: 9_000 },
        { path: 'src/stable.b.ts', touchedAt: 2_000 },
        { path: 'src/churns.ts', touchedAt: 3_000 },
      ];

      then(
        'the edited file moves to the tail, where it belongs next round',
        () => {
          // the order DOES break here — and that is honest. the scheme never claims
          // a stable-head edit is free; it claims such an edit is rarer, and that
          // the file is correctly re-filed as churn-prone once it happens
          expect(getAllTargetsByCacheStability({ targets: roundTwo })).toEqual([
            'src/stable.b.ts',
            'src/churns.ts',
            'src/stable.a.ts',
          ]);
        },
      );
    });
  });

  given(
    '[case3] a fresh clone, where every mtime is the checkout stamp',
    () => {
      const targets = [
        { path: 'src/c.ts', touchedAt: 5_000 },
        { path: 'src/a.ts', touchedAt: 5_000 },
        { path: 'src/b.ts', touchedAt: 5_000 },
      ];

      when('[t0] the corpus is ordered', () => {
        then('ties break on path, so the order is deterministic', () => {
          // 🔴 absent this the order would follow whatever sequence the filesystem
          //    enumerated, which wobbles across runs — and an unstable order defeats
          //    the very cache this sort exists to serve
          expect(getAllTargetsByCacheStability({ targets })).toEqual([
            'src/a.ts',
            'src/b.ts',
            'src/c.ts',
          ]);
        });

        then('the order is idempotent over a reshuffled input', () => {
          const reshuffled = [targets[2]!, targets[0]!, targets[1]!];
          expect(
            getAllTargetsByCacheStability({ targets: reshuffled }),
          ).toEqual(getAllTargetsByCacheStability({ targets }));
        });
      });
    },
  );

  given('[case4] a corpus that holds a file with no readable mtime', () => {
    const targets = [
      { path: 'src/deleted.ts', touchedAt: null },
      { path: 'src/present.ts', touchedAt: 1_000 },
    ];

    when('[t0] the corpus is ordered', () => {
      then('the undatable file trails, never leads', () => {
        // an unknown stamp cannot be vouched for, so it must not sit in the head
        // the cache depends on
        expect(getAllTargetsByCacheStability({ targets })).toEqual([
          'src/present.ts',
          'src/deleted.ts',
        ]);
      });
    });
  });

  given('[case5] an empty corpus', () => {
    when('[t0] the corpus is ordered', () => {
      then('it answers an empty list rather than a throw', () => {
        expect(getAllTargetsByCacheStability({ targets: [] })).toEqual([]);
      });
    });
  });

  given('[case6] a caller that must not have its input mutated', () => {
    const targets = [
      { path: 'src/z.ts', touchedAt: 1_000 },
      { path: 'src/a.ts', touchedAt: 2_000 },
    ];

    when('[t0] the corpus is ordered', () => {
      then('the input array is left in its original order', () => {
        getAllTargetsByCacheStability({ targets });
        expect(targets.map((t) => t.path)).toEqual(['src/z.ts', 'src/a.ts']);
      });
    });
  });
});
