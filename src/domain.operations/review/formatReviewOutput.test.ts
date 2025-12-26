import { given, then, when } from 'test-fns';

import { formatReviewOutput } from './formatReviewOutput';

describe('formatReviewOutput', () => {
  given('[case1] brain response with issues', () => {
    when('[t0] response contains blockers and nitpicks', () => {
      then('formats according to template', () => {
        const output = formatReviewOutput({
          response: {
            done: true,
            blockers: [
              {
                rule: 'rules/no-console.md',
                title: 'console.log found in production code',
                description:
                  'console.log statements should not be in production code.\nThey can leak sensitive information and clutter logs.',
                file: 'src/invalid.ts',
                line: 5,
              },
            ],
            nitpicks: [
              {
                rule: 'rules/prefer-const.md',
                title: 'prefer const over let',
                description:
                  'Use const for variables that are never reassigned.\nThis makes intent clearer.',
                file: 'src/invalid.ts',
                line: 10,
              },
            ],
          },
        });
        expect(output).toContain('# blocker.1: console.log found');
        expect(output).toContain('**rule**: rules/no-console.md');
        expect(output).toContain('console.log statements should not be');
        expect(output).toContain('# nitpick.1: prefer const');
        expect(output).toContain('**rule**: rules/prefer-const.md');
      });

      then('includes file location', () => {
        const output = formatReviewOutput({
          response: {
            done: true,
            blockers: [
              {
                rule: 'rules/example.md',
                title: 'issue found',
                description: 'detailed description of the issue',
                file: 'src/file.ts',
                line: 42,
              },
            ],
            nitpicks: [],
          },
        });
        expect(output).toContain('src/file.ts:42');
      });
    });

    when('[t1] blockers appear before nitpicks', () => {
      then('blockers are output first', () => {
        const output = formatReviewOutput({
          response: {
            done: true,
            blockers: [
              {
                rule: 'rules/blocker.md',
                title: 'blocker title',
                description: 'blocker description',
              },
            ],
            nitpicks: [
              {
                rule: 'rules/nitpick.md',
                title: 'nitpick title',
                description: 'nitpick description',
              },
            ],
          },
        });
        const blockerIndex = output.indexOf('blocker');
        const nitpickIndex = output.indexOf('nitpick');
        expect(blockerIndex).toBeLessThan(nitpickIndex);
      });
    });

    when('[t2] multiple blockers', () => {
      then('numbers them sequentially', () => {
        const output = formatReviewOutput({
          response: {
            done: true,
            blockers: [
              {
                rule: 'rules/a.md',
                title: 'first blocker',
                description: 'first description',
              },
              {
                rule: 'rules/b.md',
                title: 'second blocker',
                description: 'second description',
              },
              {
                rule: 'rules/c.md',
                title: 'third blocker',
                description: 'third description',
              },
            ],
            nitpicks: [],
          },
        });
        expect(output).toContain('# blocker.1:');
        expect(output).toContain('# blocker.2:');
        expect(output).toContain('# blocker.3:');
      });
    });
  });

  given('[case2] brain response with no issues', () => {
    when('[t0] response is clean', () => {
      then('outputs success message', () => {
        const output = formatReviewOutput({
          response: { done: true, blockers: [], nitpicks: [] },
        });
        expect(output).toContain('no issues found');
      });
    });
  });

  given('[case3] issues without file location', () => {
    when('[t0] issue has no file', () => {
      then('omits location line', () => {
        const output = formatReviewOutput({
          response: {
            done: true,
            blockers: [
              {
                rule: 'rules/general.md',
                title: 'general issue',
                description: 'this is a general issue without a specific file',
              },
            ],
            nitpicks: [],
          },
        });
        expect(output).toContain('# blocker.1: general issue');
        expect(output).toContain('**rule**: rules/general.md');
        expect(output).not.toContain('**location**');
      });
    });
  });
});
