import { given, then, when } from 'test-fns';

import { formatReviewOutput } from './formatReviewOutput';

describe('formatReviewOutput', () => {
  given('[case1] brain response with issues', () => {
    when('[t0] response has blockers and nitpicks', () => {
      then('formats per template', () => {
        const output = formatReviewOutput({
          response: {
            done: true,
            blockers: [
              {
                rule: 'rules/no-console.md',
                title: 'console.log found in production code',
                description:
                  'console.log statements should not be in production code.\nThey can leak sensitive information and clutter logs.',
                locations: ['src/invalid.ts:5'],
              },
            ],
            nitpicks: [
              {
                rule: 'rules/prefer-const.md',
                title: 'prefer const over let',
                description:
                  'Use const for variables that are never reassigned.\nThis makes intent clearer.',
                locations: ['src/invalid.ts:10'],
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

      then('includes locations', () => {
        const output = formatReviewOutput({
          response: {
            done: true,
            blockers: [
              {
                rule: 'rules/example.md',
                title: 'issue found',
                description: 'detailed description of the issue',
                locations: ['src/file.ts:42'],
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
                locations: ['src/a.ts:1'],
              },
            ],
            nitpicks: [
              {
                rule: 'rules/nitpick.md',
                title: 'nitpick title',
                description: 'nitpick description',
                locations: ['src/b.ts:2'],
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
                locations: ['src/a.ts:1'],
              },
              {
                rule: 'rules/b.md',
                title: 'second blocker',
                description: 'second description',
                locations: ['src/b.ts:2'],
              },
              {
                rule: 'rules/c.md',
                title: 'third blocker',
                description: 'third description',
                locations: ['src/c.ts:3'],
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

    when('[t3] issue has multiple locations', () => {
      then('lists all locations', () => {
        const output = formatReviewOutput({
          response: {
            done: true,
            blockers: [
              {
                rule: 'rules/no-console.md',
                title: 'console.log found',
                description: 'remove console.log statements',
                locations: [
                  'src/file1.ts:10',
                  'src/file2.ts:25',
                  'src/file3.ts:42',
                ],
              },
            ],
            nitpicks: [],
          },
        });
        expect(output).toContain('- src/file1.ts:10');
        expect(output).toContain('- src/file2.ts:25');
        expect(output).toContain('- src/file3.ts:42');
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

  given('[case3] issue with empty locations', () => {
    when('[t0] locations array is empty', () => {
      then('omits locations section', () => {
        const output = formatReviewOutput({
          response: {
            done: true,
            blockers: [
              {
                rule: 'rules/general.md',
                title: 'general issue',
                description:
                  'this is a general issue without specific locations',
                locations: [],
              },
            ],
            nitpicks: [],
          },
        });
        expect(output).toContain('# blocker.1: general issue');
        expect(output).toContain('**rule**: rules/general.md');
        expect(output).not.toContain('**locations**');
      });
    });
  });
});
