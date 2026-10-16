import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import { asIsoPrice } from 'iso-price';
import type { BrainSpec } from 'rhachet/brains';
import { getError, given, then, useThen, when } from 'test-fns';

import { asPromptSectionChars } from './asPromptSectionChars';
import { compileReviewPrompt } from './compileReviewPrompt';
import { ReviewContextOverflowError } from './ReviewContextOverflowError';

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
        // the target size is derived from the prompt's own fixed overhead, never
        // a hand-tuned literal — a literal here is pinned to whatever the static
        // head weighed the day it was written, so any edit to the head would
        // silently walk the fixture out of the band this case exists to
        // exercise (rule.require.clamp-edge-cases: clamp the class, never the instance)
        const contextWindowSize = 3000;
        const compileWith = (input: { content: string }) =>
          compileReviewPrompt({
            refs: [],
            rules: [{ path: 'rule.md', content: '# rule' }],
            targets: [{ path: 'file.ts', content: input.content }],
            focus: 'push',
            goal: 'representative',
            contextWindowSize,
            costSpec: costSpecFixture,
          });

        // measure the overhead, then size the payload to land mid-band (~67.5%)
        const overheadTokens = compileWith({ content: '' }).tokenEstimate;
        const payloadTokens =
          Math.round(contextWindowSize * 0.675) - overheadTokens;
        const result = compileWith({ content: 'x'.repeat(payloadTokens * 4) });
        expect(result.contextWindowPercent).toBeGreaterThanOrEqual(60);
        expect(result.contextWindowPercent).toBeLessThan(75);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('potential quality degradation');
      });
    });

    when('[t2] content exceeds 75% of context window', () => {
      then('throws with clear error and recommendation', async () => {
        // derived, exactly as `[t1]` above is, and for the same reason — a
        // hand-tuned literal is pinned to whatever the static head weighed the
        // day it was written, and an edit to the head would walk the fixture
        // out of band for a reason that names the head, not this threshold
        // (rule.require.clamp-edge-cases: clamp the class, never the instance)
        const contextWindowSize = 2000;
        const compileWith = (input: { content: string; window: number }) =>
          compileReviewPrompt({
            refs: [],
            rules: [{ path: 'rule.md', content: '# rule' }],
            targets: [{ path: 'large.ts', content: input.content }],
            focus: 'push',
            goal: 'representative',
            contextWindowSize: input.window,
            costSpec: costSpecFixture,
          });

        // the overhead is measured at a wide window, never at the narrow one
        // under test. `tokenEstimate` is a property of the prompt and the window
        // decides only the percentage, so the figure is the same either way —
        // but at 2000 the empty compile could itself trip the failfast this case
        // exercises, and the measurement would then throw instead of answer
        const overheadTokens = compileWith({
          content: '',
          window: 200_000,
        }).tokenEstimate;

        // size the payload to land ABOVE the 75% bar, at ~80%
        const payloadTokens =
          Math.round(contextWindowSize * 0.8) - overheadTokens;

        // if the head outgrew the band, the derivation cannot reach 80% — a
        // `repeat` of a negative throws a RangeError that names neither this
        // case nor the cause, so the state is refused by name instead
        if (payloadTokens <= 0)
          throw new UnexpectedCodePathError(
            'the static head already exceeds 80% of the window this case narrows to',
            {
              overheadTokens,
              contextWindowSize,
              hint: 'widen `contextWindowSize` in this case rather than shrink the payload',
            },
          );

        const error = await getError(async () =>
          compileWith({
            content: 'x'.repeat(payloadTokens * 4),
            window: contextWindowSize,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error?.message).toContain('exceeds 75%');
        expect(error?.message).toMatch(/reduce scope|--pull/);

        // the two figures the driver's diagnostic renders are carried by the
        // refusal, never parsed back out of the sentence above — a reword of the
        // sentence must not be able to degrade the diagnostic to `?% of ? tokens`
        expect(error).toBeInstanceOf(ReviewContextOverflowError);
        const { figures } = error as ReviewContextOverflowError;
        expect(figures.windowTokens).toEqual(contextWindowSize);
        expect(figures.percentOfWindow).toBeGreaterThan(75);
        expect(figures.promptTokens).toBeGreaterThan(contextWindowSize * 0.75);

        // 🔴 the composition rides too — measured BEFORE the gate, so a refused
        // prompt still says which named input overran the window. the payload
        // here is one target body, so `targetFiles` carries it
        const { composition } = error as ReviewContextOverflowError;
        expect(composition.inputs.targetFiles.chars).toEqual(payloadTokens * 4);
        expect(composition.inputs['targetDiffs.mutations'].chars).toEqual(0);
      });

      then('🔴 and the sentence is rendered FROM those figures', () => {
        // a real composition, from a prompt that fit — the constructor carries it as is
        const { composition } = compileReviewPrompt({
          rules: [{ path: 'r.md', content: 'rule' }],
          refs: [],
          targets: [{ path: 't.ts', content: 'body' }],
          focus: 'push',
          goal: 'exhaustive',
          contextWindowSize: 1_000_000,
          costSpec: costSpecFixture,
        });
        const error = new ReviewContextOverflowError(
          {
            percentOfWindow: 244.3,
            windowTokens: 256_000,
            promptTokens: 625_408,
          },
          composition,
        );
        expect(error.composition).toEqual(composition);

        // the read path touches the field alone — the prose is an output of this
        // constructor, never an input to the read
        expect(error.figures).toEqual({
          percentOfWindow: 244.3,
          windowTokens: 256_000,
          promptTokens: 625_408,
        });

        // this is the assertion that parts a carried figure from a metadata
        // bag beside a hand-written sentence: one constructor renders both, so a
        // reword that drifts from the data cannot pass here
        expect(error.message).toContain('244.3% of 256,000 tokens');
      });

      /**
       * .the grain this clamps, stated so it is not over-read
       *
       * it observes the seam — two figures that cross one call. it does not
       * observe `stepReview`'s stderr render, which has no test of its own.
       * with the parse step gone there is no decode between the throw and
       * the render that could fail on its own, so the seam is the
       * observable grain (rule.require.clamp-edge-cases).
       */
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
    /**
     * .note = a new file's body must be carried exactly once, never as both
     *   file and diff. each claim below is its own `then`, named for what it holds.
     */
    when('[t0] new file (content only, marked new)', () => {
      const result = useThen('the prompt compiles', () =>
        compileReviewPrompt({
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
        }),
      );

      then('the prompt renders whole, diffable in the PR', () => {
        expect(result.prompt).toContain('src/new.ts');
        expect(result.prompt).toContain('export const created = 1;');
        expect(result.prompt).toContain('# rule');
        expect(result.prompt).toMatchSnapshot();
      });

      // .retired = this case once asserted `renders new-file diff then full content`:
      //            `toContain('new file mode 100644')`, a `<target.diff path="src/new.ts">`
      //            block AND a `<target.file path="src/new.ts">` block. retired on purpose:
      //            that shape sent a new file's body twice, and the wish's bar 6 (`F17`)
      //            demands each body be carried once. the thens below hold the new intent
      then('🔴 a new file sends its raw git diff nowhere', () => {
        // a new file's git diff IS its body, `+` per line, under a `new file mode`
        // preamble. it is strictly larger than the content it duplicates and
        // carries not one byte the content does not
        expect(result.prompt).not.toContain('new file mode 100644');
        expect(result.prompt).not.toContain('+export const created = 1;');
      });

      then('🔴 it arrives as an ADDITION, in the diff group, once', () => {
        // a new file IS a diff of this branch — the whole body is the add. labelled
        // so, it reads as a change the branch made, never as surround context
        expect(result.prompt).toContain(
          '<target.diff path="src/new.ts" kind="+">',
        );
        expect(result.prompt).not.toContain('<target.file path="src/new.ts"');
        expect(
          result.prompt.split('export const created = 1;').length - 1,
        ).toEqual(1);
      });

      then(
        '🔴 the census counts what was SENT, never what the target held',
        () => {
          expect(result.composition.inputs.targetFiles.chars).toEqual(0);

          // a negative residual throws from inside `getOnePromptComposition`
          // (`getOneAttributionGrade`, `UnexpectedCodePathError`), so a plain
          // `markup >= 0` assertion here would be unreachable-when-false and
          // could never fail — an assertion that cannot fail is fraud, however
          // true its comment (rule.forbid.failhide).
          //
          // the claim that discriminates is the additions row: the body is counted
          // exactly once, at its own length, so the 132-char diff that duplicates it
          // enters no row at all. this fails if the census folds a dropped diff back in.
          expect(
            result.composition.inputs['targetDiffs.additions'].chars,
          ).toEqual('export const created = 1;\n'.length);
        },
      );
    });

    when('[t1] edited file (content-first + diff)', () => {
      const result = useThen('the prompt compiles', () =>
        compileReviewPrompt({
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
        }),
      );

      then('renders full current content, then its hunks', () => {
        expect(result.prompt).toMatchSnapshot();
      });

      // .retired = this case once asserted `renders hunks then full current content`:
      //            `diffIdx < contentIdx` on `<target.diff path="src/edited.ts">` and
      //            `<target.file path="src/edited.ts">` (diff-first). retired on purpose:
      //            a diff is volatile and a body is stable, so diff-first put a volatile
      //            block ahead of every later body and voided the shared prefix behind
      //            it (rule.require.order-prompt-sections-by-volatility-then-size). the
      //            then below holds the new intent
      then('🔴 the file body leads its hunks (the cache contract)', () => {
        const diffIdx = result.prompt.indexOf(
          '<target.diff path="src/edited.ts" kind="~">',
        );
        const contentIdx = result.prompt.indexOf(
          '<target.file path="src/edited.ts">',
        );
        expect(diffIdx).toBeGreaterThan(-1);
        expect(contentIdx).toBeGreaterThan(-1);
        expect(contentIdx).toBeLessThan(diffIdx);
      });

      then('the diff carries both the removed and the added line', () => {
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

        // a deletion is a diff of this branch — a void tag in the diff group
        expect(result.prompt).toContain(
          '<target.diff path="src/gone.ts" kind="-" />',
        );

        // no open diff block and no file tag for a deleted file
        expect(result.prompt).not.toContain(
          '<target.diff path="src/gone.ts" kind="-">',
        );
        expect(result.prompt).not.toContain('<target.file path="src/gone.ts"');
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
          '<target.diff path="src/unchanged.ts"',
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
        expect(result.prompt).toContain(
          '<target.diff path="assets/logo.png" kind="~">',
        );
      });
    });

    when('[t5] since-staged edited file', () => {
      then('renders plain content + diff with no extra note attribute', () => {
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
          '<target.diff path="src/edited.ts"',
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
        const result = useThen('the prompt compiles', () =>
          compileReviewPrompt({
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
                content: 'export const added = (n: number): number => n + 1;\n',
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
          }),
        );

        then('the prompt renders whole, diffable in the PR', () => {
          expect(result.prompt).toContain('src/added.ts');
          expect(result.prompt).toContain('src/edited.ts');
          expect(result.prompt).toContain('src/gone.ts');
          expect(result.prompt).toContain('src/unchanged.ts');
          expect(result.prompt).toContain('forbid the any type');
          expect(result.prompt).toMatchSnapshot();
        });

        /**
         * .note = a new file's git diff is its body again, `+` per line, so the
         *   body is carried exactly once — as an addition, its raw body.
         *
         * .retired = this case once asserted `<target.diff path="src/added.ts">` AND
         *   `<target.file path="src/added.ts">` for the added file. retired on purpose:
         *   that pair sent the body twice, which the wish's bar 6 (`F17`) forbids
         */
        then(
          '🔴 a new file renders as an addition, its body once, no file tag',
          () => {
            expect(result.prompt).toContain(
              '<target.diff path="src/added.ts" kind="+">',
            );
            expect(result.prompt).not.toContain(
              '<target.file path="src/added.ts"',
            );
            expect(result.prompt).not.toContain('new file mode 100644');
          },
        );

        then(
          '🔴 the diff group runs additions, then deletions, then mutations',
          () => {
            // additions and deletions are base-independent, so they sit ahead of
            // the per-round mutations, inside the cacheable run
            const at = (needle: string) => result.prompt.indexOf(needle);
            expect(at('kind="+"')).toBeLessThan(at('kind="-"'));
            expect(at('kind="-"')).toBeLessThan(
              at('<target.diff path="src/edited.ts" kind="~">'),
            );
          },
        );

        then('an edited file renders its diff, then its content', () => {
          // there the diff is a real delta, so it earns its bytes
          expect(result.prompt).toContain(
            '<target.diff path="src/edited.ts" kind="~">',
          );
          expect(result.prompt).toContain('<target.file path="src/edited.ts">');
        });

        then('an unchanged file renders its content, with no diff', () => {
          expect(result.prompt).toContain(
            '<target.file path="src/unchanged.ts">',
          );
          expect(result.prompt).not.toContain(
            '<target.diff path="src/unchanged.ts"',
          );
        });

        then(
          'a deleted file renders a lone marker, no diff nor content',
          () => {
            expect(result.prompt).toContain(
              '<target.diff path="src/gone.ts" kind="-" />',
            );
            expect(result.prompt).not.toContain(
              '<target.diff path="src/gone.ts" kind="-">',
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
      const result = useThen('the prompt compiles', () =>
        compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'file.ts', content: 'code' }],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        }),
      );

      then('includes context window percentage', () => {
        expect(result.contextWindowPercent).toBeDefined();
        expect(typeof result.contextWindowPercent).toBe('number');
      });

      then('includes cost estimate', () => {
        expect(result.costEstimate).toBeDefined();
        expect(typeof result.costEstimate).toBe('string');
        expect(result.costEstimate).toMatch(/^\$/); // human-readable price starts with $
      });
    });
  });

  given('[case-conversation] conversation files are supplied', () => {
    when('[t0] compiled with a prior .given + .taken', () => {
      then('renders a labeled conversation section distinct from refs', () => {
        const result = compileReviewPrompt({
          refs: [{ path: 'refs/context.md', content: 'some ref context' }],
          conversation: [
            {
              path: '.reviews/peer/1.x._.review.i001.h.r001._.given.by_peer.arch.md',
              content: '1 blockers\nfix the issue',
            },
            {
              path: '.reviews/peer/1.x._.review.i001.h.r001._.taken.by_self.arch.md',
              content: 'fixed by X',
            },
          ],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'file.ts', content: 'code' }],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        // conversation renders under its OWN labeled section
        expect(result.prompt).toContain('## prior conversation');
        expect(result.prompt).toContain('<conversation>');
        expect(result.prompt).toContain('_.given.by_peer.arch.md');
        expect(result.prompt).toContain('_.taken.by_self.arch.md');
        // refs remain a SEPARATE section (no merge/collision)
        expect(result.prompt).toContain('<refs>');
        expect(result.prompt).toContain('some ref context');
      });
    });

    when('[t1] no conversation is supplied (first iteration)', () => {
      then('omits the conversation section entirely', () => {
        const result = compileReviewPrompt({
          refs: [],
          conversation: [],
          rules: [{ path: 'rule.md', content: '# rule' }],
          targets: [{ path: 'file.ts', content: 'code' }],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        });
        expect(result.prompt).not.toContain('## prior conversation');
        // the absent block is the open tag on its own line, never a bare
        // text match: instruction item 7 names `<conversation>` in prose
        // unconditionally, on purpose, so a bare match here would forbid
        // that repair (rule.require.name-the-shared-prefix-as-the-cache-anchor)
        expect(result.prompt).not.toContain('\n<conversation>\n');
        // and a bare-tag check still holds, on the CLOSE tag: prose names only the
        // open tag, so any `</conversation>` in the prompt is a stray block
        expect(result.prompt).not.toContain('</conversation>');
      });
    });
  });

  // boundary-condition snapshot matrix — the EXACT prompt a reviewer receives
  // for each initial condition it could face. these full-prompt snapshots are the
  // artifact a human reviews to see precisely what the brain reads: the
  // CRITICAL-INSTRUCTIONS item 7, the <conversation> block, the [REPAIR]/[REFUTE]
  // vocabulary, and the detailed .report content, verbatim.
  given(
    '[case-prompt-matrix] the compiled prompt across initial conditions',
    () => {
      // shared fixtures so each snapshot differs ONLY by the conversation condition
      const rules = [
        {
          path: 'rule.no-console.md',
          content: '# rule: no-console\nforbid console.log',
        },
      ];
      const targets = [
        { path: 'src/valid.ts', content: 'export const valid = 1;' },
      ];
      const base = {
        rules,
        targets,
        focus: 'push' as const,
        goal: 'representative' as const,
        contextWindowSize: 200000,
        costSpec: costSpecFixture,
      };

      // the detailed .report.md content the conversation now always carries
      const givenSummary = {
        path: '.reviews/peer/1.x._.review.i001.h.r001._.given.by_peer.arch.md',
        content: '1 blockers\n0 nitpicks',
      };
      const givenReport = {
        path: '.reviews/peer/1.x._.review.i001.h.r001._.given.by_peer.arch.report.md',
        content:
          '# blocker.1: console.log left in src/valid.ts\n\n**locations**:\n- src/valid.ts:1\n\nremove the console.log',
      };
      const takenRepair = {
        path: '.reviews/peer/1.x._.review.i001.h.r001._.taken.by_self.arch.md',
        content:
          '# blocker.1\n\n[REPAIR] removed the console.log — src/valid.ts:1.',
      };
      const takenRefute = {
        path: '.reviews/peer/1.x._.review.i001.h.r001._.taken.by_self.arch.md',
        content:
          '# blocker.1\n\n[REFUTE] this is extant code relocated by refactor B — out of scope for this diff.',
      };

      when('[t0] no conversation (first iteration)', () => {
        then('prompt omits the conversation section — snapshot', () => {
          const result = compileReviewPrompt({
            ...base,
            refs: [],
            conversation: [],
          });
          // the absent thing is the block, never a bare text match — instruction
          // item 7 names `<conversation>` in prose unconditionally, and that is
          // the repair, not a defect (see the peer assertion in case-conversation)
          expect(result.prompt).not.toContain('\n<conversation>\n');
          expect(result.prompt).not.toContain('</conversation>');
          expect(result.prompt).toMatchSnapshot();
        });
      });

      when('[t1] given-only (critique raised, not yet answered)', () => {
        then('prompt threads the lone summary given — snapshot', () => {
          const result = compileReviewPrompt({
            ...base,
            refs: [],
            conversation: [givenSummary],
          });
          expect(result.prompt).toContain('## prior conversation');
          expect(result.prompt).toMatchSnapshot();
        });
      });

      when('[t2] given + detailed report (no taken yet)', () => {
        then('prompt threads the detailed critique — snapshot', () => {
          const result = compileReviewPrompt({
            ...base,
            refs: [],
            conversation: [givenSummary, givenReport],
          });
          expect(result.prompt).toContain('console.log left in src/valid.ts');
          expect(result.prompt).toMatchSnapshot();
        });
      });

      when('[t3] given + report + [REPAIR] taken', () => {
        then('prompt shows the driver claimed a fix — snapshot', () => {
          const result = compileReviewPrompt({
            ...base,
            refs: [],
            conversation: [givenSummary, givenReport, takenRepair],
          });
          expect(result.prompt).toContain('[REPAIR]');
          expect(result.prompt).toMatchSnapshot();
        });
      });

      when('[t4] given + report + [REFUTE] taken', () => {
        then('prompt shows the driver argued back — snapshot', () => {
          const result = compileReviewPrompt({
            ...base,
            refs: [],
            conversation: [givenSummary, givenReport, takenRefute],
          });
          expect(result.prompt).toContain('[REFUTE]');
          expect(result.prompt).toMatchSnapshot();
        });
      });

      when('[t5] multi-reviewer conversation (two prior threads)', () => {
        then('prompt threads both reviewers dialogue — snapshot', () => {
          const result = compileReviewPrompt({
            ...base,
            refs: [],
            conversation: [
              givenSummary,
              givenReport,
              takenRepair,
              {
                path: '.reviews/peer/1.x._.review.i001.h.r002._.given.by_peer.mech.md',
                content: '1 blockers\n0 nitpicks',
              },
              {
                path: '.reviews/peer/1.x._.review.i001.h.r002._.given.by_peer.mech.report.md',
                content:
                  '# blocker.1: mutable accumulator\n\n**locations**:\n- src/valid.ts:1',
              },
              {
                path: '.reviews/peer/1.x._.review.i001.h.r002._.taken.by_self.mech.md',
                content: '# blocker.1\n\n[REFUTE] extant code, out of scope.',
              },
            ],
          });
          expect(result.prompt).toContain('_.given.by_peer.mech.md');
          expect(result.prompt).toMatchSnapshot();
        });
      });

      when('[t6] refs AND conversation both present', () => {
        then(
          'prompt renders two distinct sections, no collision — snapshot',
          () => {
            const result = compileReviewPrompt({
              ...base,
              refs: [{ path: 'refs/context.md', content: 'some ref context' }],
              conversation: [givenSummary, givenReport, takenRepair],
            });
            expect(result.prompt).toContain('<refs>');
            expect(result.prompt).toContain('<conversation>');
            expect(result.prompt).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case-wide-corpus] a real corpus of many SMALL files', () => {
    /**
     * .why = the hazard a share bound cannot see, and the reason the census
     * grades rather than refuses.
     *
     * markup scales with the block count — a `<target.file path="…">` open tag,
     * a close tag, and a `\n\n---\n\n` join, per target. an unattributed input
     * scales with the corpus. so a repo of many small files drives the share
     * past any bound on legitimate decoration, and no floor on absolute chars
     * can part the two.
     *
     * a detector that throws here does not catch a defect — it kills every
     * review of a repo shaped like that, and the instrument becomes the outage.
     */
    const asSmallTarget = (index: number) => ({
      path: `src/domain.operations/lane/getOneLaneNumber${index}.ts`,
      content: `export const lane${index} = ${index};\n`,
      changeKind: 'edited' as const,
      diff: `@@\n+export const lane${index} = ${index};\n`,
    });

    when('[t0] the prompt is compiled over 293 small targets', () => {
      const compile = () =>
        compileReviewPrompt({
          refs: [],
          rules: [{ path: 'rules/rule.md', content: '# rule\nforbid it' }],
          targets: Array.from({ length: 293 }, (_, index) =>
            asSmallTarget(index),
          ),
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200_000,
          costSpec: costSpecFixture,
        });

      // compiled once and shared, since a 293-target compile is real work
      // (rule.forbid.redundant-expensive-operations). the `useThen` is the
      // does-not-throw assertion: if `compile()` raises, this block reds.
      const compiled = useThen(
        '🔴 it COMPILES — the census may not kill a live review',
        () => compile(),
      );

      then('and the markup share is genuinely past its bound', () => {
        const { composition } = compiled;
        const share = composition.inputs.markup.chars / composition.chars;

        // the clamp on the clamp: if this drops under the bound, the case has
        // stopped to exercise the hazard it was written for. every one of those
        // chars is a real tag around a real block
        expect(share).toBeGreaterThan(0.1);
        expect(composition.inputs.markup.chars).toBeGreaterThan(2_000);
      });

      then('so the census GRADES its coverage rather than reports it', () => {
        const { composition } = compiled;

        // the honest disposition: it could not stand behind the attribution, so
        // it says so — never a silent figure, and never a dead review
        expect(composition.attribution).toEqual('unattributed');
      });
    });
  });

  given('[case9] a review with no rule files', () => {
    /**
     * .why = `asPromptSectionChars` reads the `<rules>` tag as the witness that a
     *        prompt is a review prompt, and answers absent where the tag is gone. so the
     *        tag must render even when the rubric is empty — a refactor that made it
     *        conditional, like its `<refs>` and `<conversation>` peers, would silently
     *        drop every rubric-less run out of the composition census
     */
    when('[t0] the prompt compiles', () => {
      const result = useThen('it compiles', () =>
        compileReviewPrompt({
          refs: [],
          rules: [],
          targets: [{ path: 'src/a.ts', content: 'export const a = 1;' }],
          focus: 'push',
          goal: 'representative',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
        }),
      );

      then('🔴 the `<rules>` tag still renders, empty', () => {
        expect(result.prompt).toContain('<rules>\n\n</rules>');
      });

      then('🔴 the section reader still reads it as a review prompt', () => {
        expect(asPromptSectionChars({ prompt: result.prompt })).not.toEqual(
          null,
        );
      });
    });
  });
});
