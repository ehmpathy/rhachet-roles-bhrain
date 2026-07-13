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
        expect(result.prompt).not.toContain('<conversation>');
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
          expect(result.prompt).not.toContain('<conversation>');
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
});
