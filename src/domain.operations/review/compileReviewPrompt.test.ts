import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { compileReviewPrompt } from './compileReviewPrompt';

describe('compileReviewPrompt', () => {
  given('[case1] --push mode', () => {
    when('[t0] content is within 60% of context window', () => {
      then('injects content into prompt with no warnings', () => {
        const result = compileReviewPrompt({
          rules: [
            {
              path: 'rules/rule.no-console.md',
              content: '# rule: no-console\nforbid console.log',
            },
          ],
          targets: [
            { path: 'src/valid.ts', content: 'export const valid = 1;' },
          ],
          mode: 'push',
          contextWindowSize: 200000,
        });
        expect(result.prompt).toContain('# rule: no-console');
        expect(result.prompt).toContain('export const valid');
        expect(result.tokenEstimate).toBeGreaterThan(0);
        expect(result.contextWindowPercent).toBeLessThan(60);
        expect(result.warnings).toEqual([]);
      });
    });

    when('[t1] content exceeds 60% but under 75% of context window', () => {
      then('emits warning but continues', () => {
        // use a larger context window so base prompt overhead is small percentage
        // target ~65% of 2000 token window = 1300 tokens = ~5200 chars
        const content = 'x '.repeat(2200);
        const result = compileReviewPrompt({
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'file.ts', content }],
          mode: 'push',
          contextWindowSize: 2000,
        });
        expect(result.contextWindowPercent).toBeGreaterThanOrEqual(60);
        expect(result.contextWindowPercent).toBeLessThan(75);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('potential quality degradation');
      });
    });

    when('[t2] content exceeds 75% of context window', () => {
      then('throws with clear error and recommendation', async () => {
        // target ~80% of 2000 token window = 1600 tokens = ~6400 chars
        const content = 'x '.repeat(2800);
        const error = await getError(async () =>
          compileReviewPrompt({
            rules: [{ path: 'rule.md', content: '# rule' }],
            targets: [{ path: 'large.ts', content }],
            mode: 'push',
            contextWindowSize: 2000,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error?.message).toContain('exceeds 75%');
        expect(error?.message).toMatch(/reduce scope|--pull/);
      });
    });
  });

  given('[case2] --pull mode', () => {
    when('[t0] prompt is compiled', () => {
      then('includes only file paths, not contents', () => {
        const result = compileReviewPrompt({
          rules: [
            { path: 'rules/rule.no-console.md', content: '# rule: no-console' },
          ],
          targets: [
            { path: 'src/valid.ts', content: 'export const valid = 1;' },
            { path: 'src/invalid.ts', content: 'console.log("bad");' },
          ],
          mode: 'pull',
        });
        expect(result.prompt).toContain('src/valid.ts');
        expect(result.prompt).toContain('src/invalid.ts');
        expect(result.prompt).not.toContain('export const valid');
        expect(result.prompt).not.toContain('console.log("bad")');
      });

      then('instructs brain to open files', () => {
        const result = compileReviewPrompt({
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'src/valid.ts', content: '...' }],
          mode: 'pull',
        });
        expect(result.prompt).toMatch(/open|read/i);
      });
    });

    when('[t1] content is large', () => {
      then('does not failfast even at high percentages', () => {
        // pull mode should not fail even with large file lists
        const content = 'x '.repeat(1600);
        const result = compileReviewPrompt({
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'large.ts', content }], // content ignored in pull mode
          mode: 'pull',
          contextWindowSize: 1000,
        });
        // should succeed without throwing
        expect(result.prompt).toContain('large.ts');
        expect(result.warnings).toEqual([]);
      });
    });
  });

  given('[case3] multiple rules', () => {
    when('[t0] rules are provided', () => {
      then('all rules are included in prompt', () => {
        const result = compileReviewPrompt({
          rules: [
            { path: 'rule.no-console.md', content: '# no-console' },
            { path: 'rule.no-any.md', content: '# no-any' },
          ],
          targets: [{ path: 'src/valid.ts', content: '...' }],
          mode: 'push',
        });
        expect(result.prompt).toContain('no-console');
        expect(result.prompt).toContain('no-any');
      });
    });
  });

  given('[case4] output stats', () => {
    when('[t0] prompt is compiled', () => {
      then('includes context window percentage', () => {
        const result = compileReviewPrompt({
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'file.ts', content: 'code' }],
          mode: 'push',
          contextWindowSize: 200000,
        });
        expect(result.contextWindowPercent).toBeDefined();
        expect(typeof result.contextWindowPercent).toBe('number');
      });

      then('includes cost estimate', () => {
        const result = compileReviewPrompt({
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'file.ts', content: 'code' }],
          mode: 'push',
        });
        expect(result.costEstimate).toBeDefined();
        expect(typeof result.costEstimate).toBe('number');
      });
    });
  });
});
