import { given, then, when } from 'test-fns';

import { asReviewPartitionUnmatchedLines } from './asReviewPartitionUnmatchedLines';

describe('asReviewPartitionUnmatchedLines', () => {
  /**
   * .what = 🔴 CLAMP. one glob that matched no changed file
   * .why = the header once hardcoded the plural, so a single typo read `globs` — the noun
   *        must agree with the count
   */
  given('[case1] one glob that matched no changed file', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asReviewPartitionUnmatchedLines({
        unmatched: [{ slug: 'route', glob: 'src/rout/**' }],
        indent: '   ',
        cure: null,
      });

      then('the header states one glob, in the singular', () => {
        expect(lines[0]).toEqual(
          '   ├─ 🟡 1 glob that matched no changed file — a typo, or no change there yet',
        );
      });

      then('the glob is named under its slug', () => {
        expect(lines[1]).toEqual('   │  └─ route: src/rout/**');
      });

      then('the lines match the snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case2] two globs that matched no changed file', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asReviewPartitionUnmatchedLines({
        unmatched: [
          { slug: 'route', glob: 'src/rout/**' },
          { slug: 'review', glob: 'src/revew/**' },
        ],
        indent: '   ',
        cure: null,
      });

      then('the header states the count, in the plural', () => {
        expect(lines[0]).toEqual(
          '   ├─ 🟡 2 globs that matched no changed file — a typo, or no change there yet',
        );
      });

      then('each glob is named, the last one closes the branch', () => {
        expect(lines.slice(1)).toEqual([
          '   │  ├─ route: src/rout/**',
          '   │  └─ review: src/revew/**',
        ]);
      });
    });
  });

  given('[case3] no glob that missed', () => {
    when('[t0] the lines are rendered', () => {
      then('the branch is empty, so a sound plan reads unchanged', () => {
        expect(
          asReviewPartitionUnmatchedLines({
            unmatched: [],
            indent: '   ',
            cure: 'rhx route.guard.partition --prune x',
          }),
        ).toEqual([]);
      });
    });
  });

  /**
   * .what = 🔴 CLAMP. a stale glob in a written set, with its cure
   * .why = a stale glob once had no drop lever but a re-declaration of the whole set, so the
   *        branch now closes on the one paste that drops it
   */
  given('[case4] an unmatched glob held by a written set', () => {
    when('[t0] the lines are rendered with a cure', () => {
      const lines = asReviewPartitionUnmatchedLines({
        unmatched: [{ slug: 'route', glob: 'src/rout/**' }],
        indent: '   ',
        cure: "rhx route.guard.partition --for review --peer @all --prune 'src/rout/**' --mode apply",
      });

      then('the glob no longer closes the branch', () => {
        expect(lines[1]).toEqual('   │  ├─ route: src/rout/**');
      });

      then('the cure closes it, paste-ready', () => {
        expect(lines[2]).toEqual(
          "   │  └─ stale? drop them: rhx route.guard.partition --for review --peer @all --prune 'src/rout/**' --mode apply",
        );
      });
    });
  });
});
