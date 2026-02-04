import { BadRequestError } from 'helpful-errors';
import { asIsoPrice } from 'iso-price';
import type { BrainSpec } from 'rhachet/brains';
import { getError, given, then, when } from 'test-fns';

import { compileReviewPrompt } from './compileReviewPrompt';

/**
 * .what = fixture cost spec for xai/grok brain
 * .why = enables cost calculation in compile prompt tests
 */
const costSpecFixture: BrainSpec['cost']['cash'] = {
  per: 'token',
  input: asIsoPrice('$0.0000001'),
  output: asIsoPrice('$0.0000003'),
  cache: {
    set: asIsoPrice('$0.00000025'),
    get: asIsoPrice('$0.000000025'),
  },
};

describe('compileReviewPrompt', () => {
  given('[case1] --push mode', () => {
    when('[t0] content is within 60% of context window', () => {
      then('injects content into prompt with no warnings', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [
            {
              path: 'rules/rule.no-console.md',
              content: '# rule: no-console\nforbid console.log',
            },
          ],
          targets: [
            { path: 'src/valid.ts', content: 'export const valid = 1;' },
          ],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
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
        // target ~65% of 3000 token window = 1950 tokens = ~7800 chars
        const content = 'x '.repeat(3000);
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'file.ts', content }],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 3000,
          costSpec: costSpecFixture,
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
            refs: [],
            rules: [{ path: 'rule.md', content: '# rule' }],
            targets: [{ path: 'large.ts', content }],
            focus: 'push',
            goal: 'representative',
            contextWindowSize: 2000,
            costSpec: costSpecFixture,
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
          refs: [],
          rules: [
            { path: 'rules/rule.no-console.md', content: '# rule: no-console' },
          ],
          targets: [
            { path: 'src/valid.ts', content: 'export const valid = 1;' },
            { path: 'src/invalid.ts', content: 'console.log("bad");' },
          ],
          focus: 'pull',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        expect(result.prompt).toContain('src/valid.ts');
        expect(result.prompt).toContain('src/invalid.ts');
        expect(result.prompt).not.toContain('export const valid');
        expect(result.prompt).not.toContain('console.log("bad")');
      });

      then('instructs brain to open files', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'src/valid.ts', content: '...' }],
          focus: 'pull',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        expect(result.prompt).toMatch(/open|read/i);
      });
    });

    when('[t1] content is large', () => {
      then('does not failfast even at high percentages', () => {
        // pull mode should not fail even with large file lists
        const content = 'x '.repeat(1600);
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'large.ts', content }], // content ignored in pull mode
          focus: 'pull',
          goal: 'representative',
          contextWindowSize: 1000,
          costSpec: costSpecFixture,
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
          refs: [],
          rules: [
            { path: 'rule.no-console.md', content: '# no-console' },
            { path: 'rule.no-any.md', content: '# no-any' },
          ],
          targets: [{ path: 'src/valid.ts', content: '...' }],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
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
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'file.ts', content: 'code' }],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        expect(result.contextWindowPercent).toBeDefined();
        expect(typeof result.contextWindowPercent).toBe('number');
      });

      then('includes cost estimate', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'file.ts', content: 'code' }],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        expect(result.costEstimate).toBeDefined();
        expect(typeof result.costEstimate).toBe('string');
        expect(result.costEstimate).toMatch(/^\$/); // human-readable price starts with $
      });
    });
  });
});
