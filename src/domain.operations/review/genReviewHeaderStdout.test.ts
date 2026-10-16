import { given, then, when } from 'test-fns';

import { genReviewHeaderStdout } from './genReviewHeaderStdout';

describe('genReviewHeaderStdout', () => {
  given('[case1] a review with no scope filter named', () => {
    when('[t0] the header renders', () => {
      const output = genReviewHeaderStdout({
        brain: 'openrouter/deepseek/flash',
        focus: 'push',
        scope: { diffs: null, pathsWith: null, pathsWout: null, join: 'union' },
      });

      then(
        '🔴 the scope branch closes on one line, with no empty subtree',
        () => {
          expect(output).toContain('└─ scope: (none)');
          expect(output.endsWith('\n')).toEqual(false);
          expect(output).not.toMatch(/└─ scope\n/);
        },
      );

      then('the output matches the snapshot', () => {
        expect(output).toContain('   ├─ focus: push\n   └─ scope: (none)');
        expect(output.startsWith("🦉 let's review\n")).toEqual(true);
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] a review scoped by diffs and paths', () => {
    when('[t0] the header renders', () => {
      const output = genReviewHeaderStdout({
        brain: 'openrouter/deepseek/flash',
        focus: 'pull',
        scope: {
          diffs: 'since-main',
          pathsWith: ['src/**/*.ts'],
          pathsWout: ['**/*.test.ts'],
          join: 'intersect',
        },
      });

      then('the scope branch lists each filter, the join last', () => {
        expect(output).toContain('└─ scope\n');
        expect(output).toContain('├─ diffs: since-main');
        expect(output).toContain('├─ paths-with: src/**/*.ts');
        expect(output).toContain('├─ paths-wout: **/*.test.ts');
        expect(output).toContain('└─ join: intersect');
      });

      then('the output matches the snapshot', () => {
        expect(output).toContain('   ├─ focus: pull\n   └─ scope\n');
        expect(output.endsWith('      └─ join: intersect')).toEqual(true);
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] a review scoped by includes alone, no excludes', () => {
    when('[t0] the header renders', () => {
      const output = genReviewHeaderStdout({
        brain: 'openrouter/deepseek/flash',
        focus: 'push',
        scope: {
          diffs: null,
          pathsWith: ['src/**'],
          pathsWout: null,
          join: 'union',
        },
      });

      then(
        'the folded include list reads `paths:`, since no exclude needs to be told apart',
        () => {
          expect(output).toContain('└─ paths: src/**');
          expect(output).not.toContain('paths-with');
        },
      );

      then('the output matches the snapshot', () => {
        expect(output.endsWith('   └─ scope\n      └─ paths: src/**')).toEqual(
          true,
        );
        expect(output).not.toContain('join:');
        expect(output).toMatchSnapshot();
      });
    });
  });
});
