import { BadRequestError } from 'helpful-errors';
import { asIsoPrice } from 'iso-price';
import type { BrainSpec } from 'rhachet/brains';
import { getError, given, then, when } from 'test-fns';

import { compileReviewPrompt } from './compileReviewPrompt';

/**
 * .what = fixture cost spec for brain cost calculation
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
        // target the 60–75% band of a 3000 token window given the base prompt
        const content = 'x '.repeat(2200);
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

  given('[case5] --push mode with diffs per change kind', () => {
    when('[t0] new file (diff + content)', () => {
      then('renders new-file diff then full content', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [
            {
              path: 'src/new.ts',
              content: 'export const created = 1;\n',
              changeKind: 'new',
              diff:
                'diff --git a/src/new.ts b/src/new.ts\n' +
                'new file mode 100644\n' +
                '--- /dev/null\n' +
                '+++ b/src/new.ts\n' +
                '@@ -0,0 +1,1 @@\n' +
                '+export const created = 1;\n',
            },
          ],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        expect(result.prompt).toMatchSnapshot();

        // diff tag present, with new-file marker + all-add line
        expect(result.prompt).toContain('<target.diff path="src/new.ts">');
        expect(result.prompt).toContain('new file mode 100644');
        expect(result.prompt).toContain('+export const created = 1;');

        // full content tag present
        expect(result.prompt).toContain('<target.file path="src/new.ts">');
      });
    });

    when('[t1] edited file (diff-first + content)', () => {
      then('renders hunks then full current content', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [
            {
              path: 'src/edited.ts',
              content: 'export const value = 2;\n// context line\n',
              changeKind: 'edited',
              diff:
                'diff --git a/src/edited.ts b/src/edited.ts\n' +
                '--- a/src/edited.ts\n' +
                '+++ b/src/edited.ts\n' +
                '@@ -1,1 +1,2 @@\n' +
                '-export const value = 1;\n' +
                '+export const value = 2;\n' +
                '+// context line\n',
            },
          ],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        expect(result.prompt).toMatchSnapshot();

        // diff appears before full content (diff-first)
        const diffIdx = result.prompt.indexOf(
          '<target.diff path="src/edited.ts">',
        );
        const contentIdx = result.prompt.indexOf(
          '<target.file path="src/edited.ts">',
        );
        expect(diffIdx).toBeGreaterThan(-1);
        expect(contentIdx).toBeGreaterThan(-1);
        expect(diffIdx).toBeLessThan(contentIdx);

        // removed line present in diff (as -), added line present too
        expect(result.prompt).toContain('-export const value = 1;');
        expect(result.prompt).toContain('+export const value = 2;');
      });
    });

    when('[t2] deleted file (marker only)', () => {
      then('renders one-line marker, no diff, no content', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [
            {
              path: 'src/gone.ts',
              content: null,
              changeKind: 'deleted',
              diff: null,
            },
          ],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        expect(result.prompt).toMatchSnapshot();

        // void-tag marker present
        expect(result.prompt).toContain(
          '<target.file path="src/gone.ts" change="deleted" />',
        );

        // no diff or open content tag for a deleted file
        expect(result.prompt).not.toContain('<target.diff path="src/gone.ts">');
        expect(result.prompt).not.toContain('<target.file path="src/gone.ts">');
      });
    });

    when('[t3] unchanged path-only file (content only, no diff)', () => {
      then('renders content only, no diff section', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [
            { path: 'src/unchanged.ts', content: 'export const same = 1;\n' },
          ],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        expect(result.prompt).toMatchSnapshot();

        // full content present, no diff tag for this file
        expect(result.prompt).toContain('export const same = 1;');
        expect(result.prompt).toContain(
          '<target.file path="src/unchanged.ts">',
        );
        expect(result.prompt).not.toContain(
          '<target.diff path="src/unchanged.ts">',
        );
      });
    });

    when('[t4] binary file changed', () => {
      then('passes through Binary files differ, no garbage', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [
            {
              path: 'assets/logo.png',
              content: '(binary content placeholder)',
              changeKind: 'edited',
              diff:
                'diff --git a/assets/logo.png b/assets/logo.png\n' +
                'Binary files a/assets/logo.png and b/assets/logo.png differ\n',
            },
          ],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        expect(result.prompt).toMatchSnapshot();

        // binary marker passed through inside the diff tag
        expect(result.prompt).toContain('Binary files');
        expect(result.prompt).toContain('<target.diff path="assets/logo.png">');
      });
    });

    when('[t5] since-staged edited file', () => {
      then('renders plain diff + content with no extra note attribute', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [
            {
              path: 'src/staged.ts',
              content: 'export const value = 2;\n',
              changeKind: 'edited',
              diff: '@@ -1 +1 @@\n-export const value = 1;\n+export const value = 2;\n',
            },
          ],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
          diffRange: 'since-staged',
        });
        expect(result.prompt).toMatchSnapshot();

        // the file tag is plain — no note attribute of any kind
        expect(result.prompt).toContain('<target.file path="src/staged.ts">');
        expect(result.prompt).not.toContain('note=');
      });
    });
  });

  given('[case6] --pull mode with diff range', () => {
    when('[t0] diffRange is provided', () => {
      then('injects neither diff nor content, mentions the range', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [
            {
              path: 'src/edited.ts',
              content: 'export const value = 2;\n',
              changeKind: 'edited',
              diff: '@@ -1 +1 @@\n-export const value = 1;\n+export const value = 2;\n',
            },
          ],
          focus: 'pull',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
          diffRange: 'since-main',
        });
        expect(result.prompt).toMatchSnapshot();

        // path present, but neither content nor diff injected
        expect(result.prompt).toContain('src/edited.ts');
        expect(result.prompt).not.toContain('export const value = 2;');
        expect(result.prompt).not.toContain(
          '<target.diff path="src/edited.ts">',
        );

        // range mentioned so the brain knows what "this pr" means
        expect(result.prompt).toContain('since-main');
      });
    });
  });

  given(
    '[case8] combination — new + edited + deleted + unchanged in one prompt',
    () => {
      when('[t0] all four change kinds are present', () => {
        then(
          'diff+content for new/edited, content-only for unchanged, marker for deleted',
          () => {
            const result = compileReviewPrompt({
              refs: [],
              rules: [
                {
                  path: 'rules/rule.no-any.md',
                  content: '# rule: no-any\nforbid the any type',
                },
              ],
              targets: [
                {
                  path: 'src/added.ts',
                  content:
                    'export const added = (n: number): number => n + 1;\n',
                  changeKind: 'new',
                  diff:
                    'diff --git a/src/added.ts b/src/added.ts\n' +
                    'new file mode 100644\n' +
                    '--- /dev/null\n' +
                    '+++ b/src/added.ts\n' +
                    '@@ -0,0 +1,1 @@\n' +
                    '+export const added = (n: number): number => n + 1;\n',
                },
                {
                  path: 'src/edited.ts',
                  content:
                    'export const edited = (n: number): number => n * 2;\n',
                  changeKind: 'edited',
                  diff:
                    'diff --git a/src/edited.ts b/src/edited.ts\n' +
                    '--- a/src/edited.ts\n' +
                    '+++ b/src/edited.ts\n' +
                    '@@ -1,1 +1,1 @@\n' +
                    '-export const edited = (n: number): number => n;\n' +
                    '+export const edited = (n: number): number => n * 2;\n',
                },
                {
                  path: 'src/gone.ts',
                  content: null,
                  changeKind: 'deleted',
                  diff: null,
                },
                {
                  path: 'src/unchanged.ts',
                  content: 'export const unchanged = 1;\n',
                },
              ],
              focus: 'push',
              goal: 'exhaustive',
              contextWindowSize: 200000,
              costSpec: costSpecFixture,
              diffRange: 'since-main',
            });
            expect(result.prompt).toMatchSnapshot();

            // new + edited: diff tag then file tag
            expect(result.prompt).toContain(
              '<target.diff path="src/added.ts">',
            );
            expect(result.prompt).toContain(
              '<target.file path="src/added.ts">',
            );
            expect(result.prompt).toContain(
              '<target.diff path="src/edited.ts">',
            );
            expect(result.prompt).toContain(
              '<target.file path="src/edited.ts">',
            );

            // unchanged: file tag only, no diff tag for that path
            expect(result.prompt).toContain(
              '<target.file path="src/unchanged.ts">',
            );
            expect(result.prompt).not.toContain(
              '<target.diff path="src/unchanged.ts">',
            );

            // deleted: lone marker, no diff or open content tag
            expect(result.prompt).toContain(
              '<target.file path="src/gone.ts" change="deleted" />',
            );
            expect(result.prompt).not.toContain(
              '<target.diff path="src/gone.ts">',
            );
          },
        );
      });
    },
  );

  given('[case7] prompt copy for diff-focused review', () => {
    when('[t0] any push prompt is compiled', () => {
      then('encodes A8/A9/A10 and fix-forward guidance', () => {
        const result = compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'src/valid.ts', content: 'export const v = 1;' }],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });

        // fix-forward: focus the diff, do not churn, but flag breakage
        expect(result.prompt).toMatch(/do not churn/i);
        expect(result.prompt).toMatch(/breaks/i);

        // A8: locations come from hunk headers
        expect(result.prompt).toContain('@@ -X,Y +A,B @@');

        // A9: snippet from the clean <target.file> content, not diff lines
        expect(result.prompt).toContain('clean `<target.file>` content');

        // A10: never flag removed (-) lines
        expect(result.prompt).toMatch(/never flag a `-` line/i);
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
