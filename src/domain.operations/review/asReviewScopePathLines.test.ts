import { given, then, when } from 'test-fns';

import { asReviewScopePathLines } from './asReviewScopePathLines';

describe('asReviewScopePathLines', () => {
  given(
    '[case1] a lane scoped by --paths-with with a brace in the extension',
    () => {
      when('[t0] the lines are rendered', () => {
        const lines = asReviewScopePathLines({
          pathsWith: ['**/*.{ts,sh,md,snap}'],
          pathsWout: ['**/__snapshots__/**', '.behavior/**'],
          filesFromPaths: 5978,
        });

        then('the include glob renders verbatim, never as (none)', () => {
          expect(lines[0]).toContain('**/*.{ts,sh,md,snap}');
          expect(lines[0]).not.toContain('(none)');
        });

        then('the matched count renders, never as null', () => {
          expect(lines[1]).toContain('files: 5,978');
        });

        then(
          'the matched count groups its digits, like every count on the block',
          () => {
            expect(lines[1]).not.toContain('5978');
          },
        );

        then('each exclude glob renders', () => {
          expect(lines[2]).toContain('**/__snapshots__/**, .behavior/**');
        });

        then('the block matches its snapshot', () => {
          expect(lines).toHaveLength(3);
          expect(lines[1]).toEqual('   │  │  └─ files: 5,978');
          expect(lines.join('\n')).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] a lane with no path scope at all', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asReviewScopePathLines({
        pathsWith: [],
        pathsWout: [],
        filesFromPaths: 0,
      });

      then(
        'both globs render as (none) and the count as the absent mark',
        () => {
          expect(lines[0]).toContain('paths.with: (none)');
          expect(lines[1]).toContain('files: —');
          expect(lines[2]).toContain('paths.wout: (none)');
        },
      );

      then('the whole block matches the snapshot', () => {
        expect(lines).toHaveLength(3);
        expect(lines[0]).toEqual('   │  ├─ paths.with: (none)');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });
});
