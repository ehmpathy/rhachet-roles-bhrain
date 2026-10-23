import { given, then, when } from 'test-fns';

import { asReviewScopeEmptyRefusalLines } from './asReviewScopeEmptyRefusalLines';

describe('asReviewScopeEmptyRefusalLines', () => {
  given('[case1] a scope with no polluters dropped', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asReviewScopeEmptyRefusalLines({
        diffs: { flag: 'since-main', files: 4 },
        paths: { with: ['src/**/*.ts'], wout: [], files: 0 },
        joined: { mode: 'intersect', files: 0 },
        dropped: 0,
        logDirRelative: '.log/bhrain/review/x',
      });

      then(
        'it names the diffs count and the join, with no polluter line',
        () => {
          expect(lines).toContain('      │  └─ files: 4');
          expect(lines).toContain('      └─ joined via intersect');
          expect(lines.some((line) => line.includes('polluters'))).toEqual(
            false,
          );
          expect(lines).toMatchSnapshot();
        },
      );

      then(
        'where to look rides its own did-you-know block, never a hint row',
        () => {
          expect(lines.slice(-3)).toEqual([
            '',
            '✨ did you know?',
            '   └─ inspect .log/bhrain/review/x/input.scope.debug.json to see what was matched',
          ]);
          expect(lines.join('\n')).not.toContain('hint:');
        },
      );
    });
  });

  given('[case2] a scope emptied by dropped polluters, with no --diffs', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asReviewScopeEmptyRefusalLines({
        diffs: { flag: undefined, files: 0 },
        paths: { with: ['.behavior/**'], wout: [], files: 3 },
        joined: { mode: 'union', files: 3 },
        dropped: 3,
        logDirRelative: '.log/bhrain/review/x',
      });

      then('it names the dropped polluters and reads diffs as absent', () => {
        expect(lines).toContain('   │  ├─ diffs: (none)');
        expect(lines).toContain('   │  │  └─ files: —');
        expect(lines).toContain('   └─ polluters: 3 dropped by default');
        expect(lines).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] a --paths-with value that joins two globs with a comma',
    () => {
      when('[t0] the lines are rendered', () => {
        const lines = asReviewScopeEmptyRefusalLines({
          diffs: { flag: undefined, files: 0 },
          paths: { with: ['src/a/**,src/b/**'], wout: [], files: 0 },
          joined: { mode: 'union', files: 0 },
          dropped: 0,
          logDirRelative: '.log/bhrain/review/x',
        });

        then('it names the comma, and the fix is to repeat the flag', () => {
          expect(lines).toContain(
            '   └─ comma: a comma does not split a glob — repeat --paths-with once per glob',
          );
        });
      });
    },
  );

  given('[case4] a --paths-with value with a comma inside braces', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asReviewScopeEmptyRefusalLines({
        diffs: { flag: undefined, files: 0 },
        paths: { with: ['{src,blackbox}/**'], wout: [], files: 0 },
        joined: { mode: 'union', files: 0 },
        dropped: 0,
        logDirRelative: '.log/bhrain/review/x',
      });

      then('the comma is glob syntax, so no comma line appears', () => {
        expect(lines.some((line) => line.includes('comma:'))).toEqual(false);
      });
    });
  });
});
