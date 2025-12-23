import { given, then, when } from 'test-fns';

import { formatReviewOutput } from './formatReviewOutput';

describe('formatReviewOutput', () => {
  given('[case1] brain response with issues', () => {
    when('[t0] response contains blockers and nitpicks', () => {
      then('formats according to template', () => {
        const output = formatReviewOutput({
          response: {
            issues: [
              {
                type: 'blocker',
                message: 'console.log found',
                file: 'src/invalid.ts',
                line: 5,
              },
              {
                type: 'nitpick',
                message: 'prefer const',
                file: 'src/invalid.ts',
                line: 10,
              },
            ],
          },
        });
        expect(output).toContain('# blocker.1');
        expect(output).toContain('console.log found');
        expect(output).toContain('# nitpick.1');
        expect(output).toContain('prefer const');
      });

      then('includes file location', () => {
        const output = formatReviewOutput({
          response: {
            issues: [
              {
                type: 'blocker',
                message: 'issue found',
                file: 'src/file.ts',
                line: 42,
              },
            ],
          },
        });
        expect(output).toContain('src/file.ts:42');
      });
    });

    when('[t1] blockers appear before nitpicks', () => {
      then('blockers are output first regardless of input order', () => {
        const output = formatReviewOutput({
          response: {
            issues: [
              { type: 'nitpick', message: 'nitpick first in input' },
              { type: 'blocker', message: 'blocker second in input' },
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
            issues: [
              { type: 'blocker', message: 'first blocker' },
              { type: 'blocker', message: 'second blocker' },
              { type: 'blocker', message: 'third blocker' },
            ],
          },
        });
        expect(output).toContain('# blocker.1');
        expect(output).toContain('# blocker.2');
        expect(output).toContain('# blocker.3');
      });
    });
  });

  given('[case2] brain response with no issues', () => {
    when('[t0] response is clean', () => {
      then('outputs success message', () => {
        const output = formatReviewOutput({
          response: { issues: [] },
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
            issues: [{ type: 'blocker', message: 'general issue' }],
          },
        });
        expect(output).toContain('# blocker.1');
        expect(output).toContain('general issue');
        expect(output).not.toContain('**location**');
      });
    });
  });
});
