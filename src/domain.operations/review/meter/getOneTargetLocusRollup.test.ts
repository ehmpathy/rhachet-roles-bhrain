import { given, then, when } from 'test-fns';

import { getOneTargetLocusRollup } from '@src/domain.operations/review/meter/getOneTargetLocusRollup';

describe('getOneTargetLocusRollup', () => {
  given('[case1] a corpus spread across three directories', () => {
    const targets = [
      {
        path: 'src/domain.operations/review/compileReviewPrompt.ts',
        chars: 500,
      },
      { path: 'src/domain.operations/review/asTargetSection.ts', chars: 300 },
      { path: 'src/domain.operations/meter/asCostLeverLines.ts', chars: 100 },
      { path: 'src/contract/cli/review.ts', chars: 100 },
    ];

    when('[t0] it is rolled up at the default depth', () => {
      const rollup = getOneTargetLocusRollup({ targets });

      then('every target reaches the total — none is dropped', () => {
        // a locus that omits a target understates the mass a reader would prune
        // (rule.require.distinguish-every-review-input)
        expect(rollup.chars).toEqual(1000);
        expect(rollup.files).toEqual(4);
      });

      then('files under one directory fold into one row', () => {
        const review = rollup.rows.find(
          (row) => row.dir === 'src/domain.operations/review',
        );
        expect(review).toBeDefined();
        expect(review?.files).toEqual(2);
        expect(review?.chars).toEqual(800);
      });

      then('🔴 rows sort by chars DESC — the prunable mass leads', () => {
        // the question this answers is "what is big enough to prune", so a
        // path-sorted render would bury the answer
        expect(rollup.rows.map((row) => row.chars)).toEqual([800, 100, 100]);
      });

      then('each share is of the whole target mass', () => {
        expect(rollup.rows[0]!.share).toEqual(0.8);
      });

      then('the shares sum to one', () => {
        const summed = rollup.rows.reduce(
          (total, row) => total + (row.share ?? Number.NaN),
          0,
        );
        expect(summed).toBeCloseTo(1, 10);
      });
    });

    when('[t1] it is rolled up at a shallower depth', () => {
      const rollup = getOneTargetLocusRollup({ targets, depth: 2 });

      then('a shallower depth folds what the default split', () => {
        // depth is the dial: the default splits `review` from `meter`; one segment
        // up, both fold into `src/domain.operations`
        expect(rollup.rows.map((row) => row.dir)).toEqual([
          'src/domain.operations',
          'src/contract',
        ]);
        expect(rollup.chars).toEqual(1000);
      });
    });

    when('[t2] it is rolled up deeper than any directory goes', () => {
      const rollup = getOneTargetLocusRollup({ targets, depth: 9 });

      then('🔴 a row is still a DIRECTORY, never a file', () => {
        // depth counts directory segments, so a depth past the deepest dir stops
        // at the dir — a file in the `dir` column would make the header's
        // `over N directories` count false
        expect(rollup.rows.map((row) => row.dir)).toEqual([
          'src/domain.operations/review',
          'src/domain.operations/meter',
          'src/contract/cli',
        ]);
      });
    });
  });

  given('[case2] a target whose path is shallower than the depth', () => {
    when('[t0] it is rolled up', () => {
      const rollup = getOneTargetLocusRollup({
        targets: [
          { path: 'readme.md', chars: 400 },
          { path: 'src/index.ts', chars: 350 },
          { path: 'blackbox/review.acceptance.test.ts', chars: 200 },
          { path: 'blackbox/route.acceptance.test.ts', chars: 50 },
        ],
        depth: 3,
      });

      then('🔴 a shallow file keys to its PARENT, so its siblings fold', () => {
        // the defect this clamps: a file shallower than the depth keyed to its own
        // path, so every file under `blackbox/` was its own one-file row and no
        // row named the directory a reader would prune
        const blackbox = rollup.rows.find((row) => row.dir === 'blackbox');
        expect(blackbox?.files).toEqual(2);
        expect(blackbox?.chars).toEqual(250);
        expect(rollup.rows.map((row) => row.dir)).toContain('src');
      });

      then('🔴 a root-level file keys to itself rather than drops out', () => {
        // it has no directory to key to; dropped, the shares stop to sum to one
        // and the renderer silently understates the total
        expect(rollup.chars).toEqual(1000);
        expect(rollup.rows.map((row) => row.dir)).toEqual([
          'readme.md',
          'src',
          'blackbox',
        ]);
      });
    });
  });

  given('[case3] an empty corpus', () => {
    when('[t0] it is rolled up', () => {
      const rollup = getOneTargetLocusRollup({ targets: [] });

      then('it reports no rows and no mass, and divides by no zero', () => {
        // the guard: a share is `chars / total`, and an empty corpus has a
        // total of zero
        expect(rollup.rows).toEqual([]);
        expect(rollup.chars).toEqual(0);
        expect(rollup.files).toEqual(0);
      });
    });
  });

  given('[case4] a corpus whose every target measured zero chars', () => {
    when('[t0] it is rolled up', () => {
      const rollup = getOneTargetLocusRollup({
        targets: [
          { path: 'src/a/b/c.ts', chars: 0 },
          { path: 'src/a/b/d.ts', chars: 0 },
        ],
      });

      then('🔴 the shares are absent, never 0 and never NaN', () => {
        // a share over a zero total is undefined. `0` would claim a measured share and a
        // `0/0` would render `NaN%`; `null` lets the render print the absent mark
        expect(rollup.rows).toHaveLength(1);
        expect(rollup.rows[0]!.share).toBeNull();
        expect(rollup.rows[0]!.files).toEqual(2);
      });
    });
  });
});
