import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';
import {
  asStderrMessageLine,
  DEMO_ROLE,
  genReviewByFixture,
  invokeReviewBySkill,
  sanitizeRawReviewForSnapshot,
  sanitizeReviewByOutputForSnapshot,
  setDemoRoleRubrics,
} from './.test/invokeReviewBySkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-review-by');

/**
 * .what = config for probabilistic cases that invoke LLM review subprocesses
 * .why = LLM responses vary; retry keeps CI green while still verifying the contract
 * @see .agent/repo=.this/role=any/briefs/rule.require.repeatable-for-llm-tests.md
 */
const REPEATABLE_CONFIG = {
  attempts: 3,
  criteria: process.env.CI ? 'SOME' : 'EVERY',
} as const;

const ARROW_RULE_PATH =
  '.agent/repo=demo/role=demo/briefs/rules/rule.require.arrow-only.md';
const ARROW_RULE_BODY =
  '### arrow-only\n\nnever use the `function` keyword; use arrows.\n\nviolation = blocker\n';

/**
 * .what = reads a rubric's review output file, if written
 * .why = several cases assert which rubrics produced output (isolation, forward-scope)
 */
const readRubricOutput = async (input: {
  cwd: string;
  role: string;
  slug: string;
}): Promise<string | null> => {
  const outPath = path.join(
    input.cwd,
    '.reviews',
    `by=${input.role}`,
    `rubric=${input.slug}.md`,
  );
  return fs.readFile(outPath, 'utf-8').catch(() => null);
};

/**
 * .what = asserts a `--for` run disintermediated to the base review's stdout (no review.by tree)
 * .why = `review.by --for` must emit the base `rhx review` stdout verbatim
 *        (rule.require.review-by-disintermediates), so a route guard peer slot wraps a normal
 *        review, never a review.by tree nested inside the guard tree. asserts both halves: the
 *        base-review markers present, every review.by-tree marker absent.
 * .note = markers, not a byte-exact snapshot — the base review's stdout carries volatile
 *         token/cost/latency/log-path values (rule.require.repeatable-for-llm-tests). its shape
 *         is snapshotted at the review layer (genReviewOutputStdout tests); here we prove
 *         review.by hands it through untouched.
 */
const expectDisintermediatedRawReview = (input: {
  stdout: string;
  slug: string;
}): void => {
  // base-review markers present — the metrics blocks + the `review:` output-path line are printed
  // by genReviewOutputStdout, never by the review.by tree
  expect(input.stdout).toContain('metrics');
  expect(input.stdout).toContain(`rubric=${input.slug}.md`);
  // review.by-tree chrome absent — no `review.by --role` anchor, no `rubrics` bucket connector
  // (the `r{n} <slug>` rows only live under that bucket, so its absence proves theirs too)
  expect(input.stdout).not.toContain('review.by --role');
  expect(input.stdout).not.toMatch(/[├└]─ rubrics\b/);
};

describe('review.by.acceptance', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // cases run in order of their ordinal. the error / fail-fast boundaries are
  // deterministic, no LLM (all exit 1); the outcome boundaries are LLM-backed,
  // and each one says so via `when.repeatably`
  // ─────────────────────────────────────────────────────────────────────────

  given('[case1] valid role, no --for, code satisfies every rubric', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] review.by against clean code',
      () => {
        const res = useThen('it runs all rubrics and passes', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-case1',
            clone: ASSETS_DIR,
          });
          const cli = await invokeReviewBySkill({
            role: DEMO_ROLE,
            paths: 'src/clean.ts',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli };
        });

        then('exit 0', () => {
          expect(res.cli.code).toBe(0);
        });

        then('the header shows the all-clear owl vibe', () => {
          expect(res.cli.stdout).toContain('not even a vole');
        });

        then('the rubric shows a pass mark', () => {
          // checked on the rubric row: a bare `✓` is satisfied by the `0 nitpicks ✓` a rejected
          // rubric also prints (rule.forbid.failhide)
          expect(res.cli.stdout).toContain('r1 demo-arrow-only ✓');
        });

        then('default vibe: owl mascot + magnifier artifact', () => {
          expect(res.cli.stdout).toContain('🦉');
          expect(res.cli.stdout).toContain('🔍');
        });

        then('the positive-path contract stdout is stable (snapshot)', () => {
          // when every rubric passes, stdout is deterministic — header + rubric tree with ✓
          // marks, no review body echoed. guards the success structure against regression
          // (rule.require.contract-snapshot-exhaustiveness). sanitized so ephemeral
          // live-progress lines are stripped; asserted explicitly in the learner suite.
          expect(
            sanitizeReviewByOutputForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });
      },
    );
  });

  given('[case2] valid role, code violates a rubric', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] review.by against dirty code',
      () => {
        const res = useThen('it runs and finds blockers', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-case2',
            clone: ASSETS_DIR,
          });
          const cli = await invokeReviewBySkill({
            role: DEMO_ROLE,
            paths: 'src/dirty.ts',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli };
        });

        then('exit 2 (blockers present)', () => {
          expect(res.cli.code).toBe(2);
        });

        then('the header shows the blocker-tier owl vibe', () => {
          expect(res.cli.stdout).toContain('needs your talons');
        });

        then('a summary block carries a parseable blockers line', () => {
          expect(res.cli.stdout).toContain('summary');
          expect(res.cli.stdout).toMatch(/\d+\s*blockers?/i);
          expect(res.cli.stdout).toMatch(/\d+\s*nitpicks?/i);
        });

        then('the negative-path contract stdout is stable (snapshot)', () => {
          // the findings variant is the other key contract output beside the all-pass path
          // (case1). the single-violation fixture pins the verdict (1 blocker / 0 nitpicks), so
          // the snapshot shows real counts and guards the whole tree against regression
          // (rule.require.contract-snapshot-exhaustiveness, rule.require.acceptance-journey-coverage)
          expect(
            sanitizeReviewByOutputForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });
      },
    );
  });

  given('[case3] --for a single valid slug, code is clean → DISINTERMEDIATE', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review.by --for runs', () => {
      const res = useThen('it runs only that rubric and passes', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case3',
          clone: ASSETS_DIR,
        });
        const cli = await invokeReviewBySkill({
          role: DEMO_ROLE,
          for: 'demo-arrow-only',
          paths: 'src/clean.ts',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd,
        });
        return { cli };
      });

      then('exit 0', () => {
        expect(res.cli.code).toBe(0);
      });

      then('stdout is the RAW base review, NOT the review.by tree', () => {
        // `--for` disintermediates to the base review's stdout, so a route guard peer slot wraps
        // a normal review, not a review.by tree (rule.require.review-by-disintermediates)
        expectDisintermediatedRawReview({
          stdout: res.cli.stdout,
          slug: 'demo-arrow-only',
        });
      });

      then('the disintermediated raw-review stdout is stable (full snapshot)', () => {
        // the rubric-scoped half of the exhaustive matrix (the aggregate/global half is case1/2/13).
        // clean code gives a deterministic 0/0 verdict, so once the volatile telemetry blocks
        // are dropped (sanitizeRawReviewForSnapshot), the full disintermediated shape snapshots
        // stably — vibechecks the exact drop-in-for-plain-review output.
        expect(
          sanitizeRawReviewForSnapshot(res.cli.stdout),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case3neg] --for a single valid slug, code violates it → DISINTERMEDIATE', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review.by --for on dirty', () => {
      const res = useThen('it runs only that rubric and finds blockers', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case3neg',
          clone: ASSETS_DIR,
        });
        const cli = await invokeReviewBySkill({
          role: DEMO_ROLE,
          for: 'demo-arrow-only',
          paths: 'src/dirty.ts',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd,
        });
        return { cli };
      });

      then('exit 2 (blockers present)', () => {
        expect(res.cli.code).toBe(2);
      });

      then('stdout is the RAW base review with findings, NOT the review.by tree', () => {
        // findings also disintermediate: the base review's blocker-tier stdout is handed through
        // verbatim, so a guard tallies off a normal review
        expectDisintermediatedRawReview({
          stdout: res.cli.stdout,
          slug: 'demo-arrow-only',
        });
      });

      then('the base review carries a summary block a guard can parse', () => {
        expect(res.cli.stdout).toContain('summary');
        expect(res.cli.stdout).toMatch(/\d+\s*blockers?/i);
        expect(res.cli.stdout).toMatch(/\d+\s*nitpicks?/i);
      });

      then('the disintermediated findings-path stdout is stable (full snapshot)', () => {
        // the findings half of the rubric-scoped matrix. the single-violation fixture pins the
        // verdict (1 blocker / 0 nitpicks); findings prose lives in the review file, not stdout
        // (genReviewOutputStdout echoes only header + review path + summary), so the sanitized
        // stdout is deterministic and carries no review.by tree — proves the guard-consumed
        // dirty stdout is a plain review (rule.require.review-by-disintermediates)
        expect(
          sanitizeRawReviewForSnapshot(res.cli.stdout),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case4] --for one slug on a multi-rubric role', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] only the named rubric runs',
      () => {
        const res = useThen('it isolates the one rubric', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-case4',
            clone: ASSETS_DIR,
          });
          // a two-rubric role; --for selects only the first
          await setDemoRoleRubrics({
            cwd,
            ruleFiles: { [ARROW_RULE_PATH]: ARROW_RULE_BODY },
            rubricsYml: `rubrics:
  - slug: r-one
    rules: [${ARROW_RULE_PATH}]
  - slug: r-two
    rules: [${ARROW_RULE_PATH}]
`,
          });
          const cli = await invokeReviewBySkill({
            role: DEMO_ROLE,
            for: 'r-one',
            paths: 'src/clean.ts',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          const outOne = await readRubricOutput({
            cwd,
            role: DEMO_ROLE,
            slug: 'r-one',
          });
          const outTwo = await readRubricOutput({
            cwd,
            role: DEMO_ROLE,
            slug: 'r-two',
          });
          return { cli, outOne, outTwo };
        });

        then('only r-one appears in stdout, r-two is isolated out', () => {
          // --for disintermediates to the base review, whose `review:` line names the r-one
          // output path, so r-one shows and r-two never does
          expect(res.cli.stdout).toContain('r-one');
          expect(res.cli.stdout).not.toContain('r-two');
        });

        then('only r-one produced an output file', () => {
          expect(res.outOne).not.toBeNull();
          expect(res.outTwo).toBeNull();
        });

        then('the isolated raw review is stable (full snapshot)', () => {
          // --for disintermediates to the base review, so the raw sanitizer applies. the
          // isolation asserts FIRST, so a `--resnap` cannot pin a render that leaked r-two
          expect(res.cli.stdout).not.toContain('r-two');
          expect(sanitizeRawReviewForSnapshot(res.cli.stdout)).toMatchSnapshot();
        });
      },
    );
  });

  given('[case5] --paths + --brain forward to the review engine', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review.by forwards scope', () => {
      const res = useThen('it runs review against the given paths', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case5',
          clone: ASSETS_DIR,
        });
        const cli = await invokeReviewBySkill({
          role: DEMO_ROLE,
          paths: 'src/clean.ts',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd,
        });
        const out = await readRubricOutput({
          cwd,
          role: DEMO_ROLE,
          slug: 'demo-arrow-only',
        });
        return { cli, out };
      });

      then('the review ran and wrote its output file', () => {
        expect(res.out).not.toBeNull();
        expect((res.out ?? '').length).toBeGreaterThan(0);
      });

      then('the forwarded-scope tree is stable (full snapshot)', () => {
        // the clean mark asserts FIRST, on the rubric row, so a `--resnap` cannot pin a
        // rejected tree as truth (see the learner suite's [case-all])
        expect(res.cli.stdout).toContain('r1 demo-arrow-only ✓');
        expect(
          sanitizeReviewByOutputForSnapshot(res.cli.stdout),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case6] a role slug with no role dir', () => {
    when('[t0] review.by --role ghost runs', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case6',
          clone: ASSETS_DIR,
        });
        return invokeReviewBySkill({ role: 'ghost', cwd });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr names the absent role', () => {
        expect(res.stderr).toContain('role not found');
        expect(res.stderr).toContain('role=ghost');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case7] a --for slug not present in rubrics.yml', () => {
    when('[t0] review.by --for ghost runs', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case7',
          clone: ASSETS_DIR,
        });
        return invokeReviewBySkill({ role: DEMO_ROLE, for: 'ghost', cwd });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr names the absent rubric', () => {
        expect(res.stderr).toContain('rubric not found: ghost');
      });

      then('stderr lists the available rubrics (names the fix)', () => {
        expect(res.stderr).toContain('available rubrics:');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case8] rubrics.yml with duplicate slugs', () => {
    when('[t0] review.by runs', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case8',
          clone: ASSETS_DIR,
        });
        await setDemoRoleRubrics({
          cwd,
          ruleFiles: { [ARROW_RULE_PATH]: ARROW_RULE_BODY },
          rubricsYml: `rubrics:
  - slug: dup
    rules: [${ARROW_RULE_PATH}]
  - slug: dup
    rules: [${ARROW_RULE_PATH}]
`,
        });
        return invokeReviewBySkill({ role: DEMO_ROLE, cwd });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr names the duplicate slug', () => {
        expect(res.stderr).toContain('duplicate rubric slug: dup');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case9] rubrics.yml with an empty rubrics list', () => {
    when('[t0] review.by runs', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case9',
          clone: ASSETS_DIR,
        });
        await setDemoRoleRubrics({ cwd, rubricsYml: 'rubrics: []\n' });
        return invokeReviewBySkill({ role: DEMO_ROLE, cwd });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr says no rubrics found', () => {
        expect(res.stderr).toContain('no rubrics found in rubrics.yml');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case10] a role dir with no rubrics.yml', () => {
    when('[t0] review.by --role norub runs', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case10',
          clone: ASSETS_DIR,
        });
        // a role dir that exists but carries no rubrics.yml
        await fs.mkdir(
          path.join(cwd, '.agent/repo=demo/role=norub/briefs/reviews'),
          { recursive: true },
        );
        return invokeReviewBySkill({ role: 'norub', cwd });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr names the absent rubrics.yml', () => {
        expect(res.stderr).toContain('rubrics.yml not found for role norub');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case11] no --role arg supplied', () => {
    when('[t0] review.by runs with no role', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case11',
          clone: ASSETS_DIR,
        });
        return invokeReviewBySkill({ cwd });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr shows a usage error', () => {
        expect(res.stderr).toContain('--role is required');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case12] malformed yaml', () => {
    when('[t0] review.by runs', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case12',
          clone: ASSETS_DIR,
        });
        await setDemoRoleRubrics({
          cwd,
          rubricsYml: 'rubrics: [unclosed\n  - slug: broken\n',
        });
        return invokeReviewBySkill({ role: DEMO_ROLE, cwd });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr surfaces a parse error', () => {
        expect(res.stderr).toContain('failed to parse rubrics.yml');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case13] rubrics.yml declares a vibe override', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review.by runs', () => {
      const res = useThen('stdout carries the overridden vibe', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case13',
          clone: ASSETS_DIR,
        });
        await setDemoRoleRubrics({
          cwd,
          ruleFiles: { [ARROW_RULE_PATH]: ARROW_RULE_BODY },
          rubricsYml: `vibe:
  mascot: 🐢
  artifact: 🐚

rubrics:
  - slug: demo-arrow-only
    rules: [${ARROW_RULE_PATH}]
`,
        });
        const cli = await invokeReviewBySkill({
          role: DEMO_ROLE,
          paths: 'src/clean.ts',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd,
        });
        return { cli };
      });

      then('mascot is the turtle', () => {
        expect(res.cli.stdout).toContain('🐢');
      });

      then('artifact is the shell', () => {
        expect(res.cli.stdout).toContain('🐚');
      });

      then('the vibe-override contract stdout is stable (snapshot)', () => {
        // clean code gives an all-pass, deterministic run snapped whole — locks the full tree
        // around the swapped glyphs, not just their presence, so an indent/structure regression
        // around the override is caught
        expect(
          sanitizeReviewByOutputForSnapshot(res.cli.stdout),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case14] a prefer-severity rubric never forces a blocker exit', () => {
    // a `prefer` rubric can only yield nitpicks, never blockers, so the exit must stay 0
    // regardless of the reviewer's score. the exit code holds whether or not the LLM emits a
    // nitpick at all; the stdout is snapped with the brain-decided bytes masked.
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] a prefer rubric runs',
      () => {
        const res = useThen('it never exits with the blocker code', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-case14',
            clone: ASSETS_DIR,
          });
          const preferRulePath =
            '.agent/repo=demo/role=demo/briefs/rules/rule.prefer.lowercase.md';
          await setDemoRoleRubrics({
            cwd,
            ruleFiles: {
              [preferRulePath]:
                '### prefer lowercase comments\n\nprefer lowercase in comments.\n\nviolation = nitpick (never a blocker)\n',
            },
            rubricsYml: `rubrics:
  - slug: demo-lowercase
    purpose: prefer lowercase comments
    rules: [${preferRulePath}]
`,
          });
          const cli = await invokeReviewBySkill({
            role: DEMO_ROLE,
            paths: 'src/clean.ts',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli };
        });

        then('exit 0 — a nitpick never escalates to the blocker exit (2)', () => {
          expect(res.cli.code).toBe(0);
        });

        then('the prefer-rubric contract stdout is stable (masked snapshot)', () => {
          // the exit asserts FIRST, so a `--resnap` cannot pin a blocker exit as truth.
          // what the brain decides is masked, never carved out
          // (rule.require.contract-snapshot-exhaustiveness): the header vibe and the row
          // mark key on whether it found a nitpick, and the rows beneath r1 exist only
          // when it did. the structure around them — the role, the rubrics rail, and the
          // r1 row — is real, and stays under the snapshot
          // .note = the RAIL is brain-decided too: when a nitpick section follows, the
          //         rubrics branch draws `├─` and the r1 row rides a `│`; when none does,
          //         `└─` and a blank. measured: attempt 2 of one run drew `├─` while 1 and
          //         3 drew `└─`, so the rail is masked like the mark
          expect(res.cli.code).toBe(0);
          const sanitized = sanitizeReviewByOutputForSnapshot(res.cli.stdout);
          expect(sanitized).toContain('r1 demo-lowercase');
          const lines = sanitized.split('\n');
          const atRow = lines.findIndex((line) =>
            line.includes('r1 demo-lowercase'),
          );
          const masked = [
            '[VIBE]',
            ...lines
              .slice(1, atRow)
              .map((line) => line.replace(/^( *)[├└]─ rubrics$/, '$1[RAIL]─ rubrics')),
            lines[atRow]!
              .replace(/^( {3})[│ ]( {2}└─ r1 )/, '$1[RAIL]$2')
              .replace(/ [✓✗]$/, ' [MARK]'),
          ].join('\n');
          expect(masked).toMatchSnapshot();
        });
      },
    );
  });

  given('[case15] --for one slug, code violates it (the guard shape)', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] single rubric with findings',
      () => {
        const res = useThen('it emits a parseable summary', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-case15',
            clone: ASSETS_DIR,
          });
          const cli = await invokeReviewBySkill({
            role: DEMO_ROLE,
            for: 'demo-arrow-only',
            paths: 'src/dirty.ts',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli };
        });

        then('exit 2', () => {
          expect(res.cli.code).toBe(2);
        });

        then('even a single-rubric run emits a summary block', () => {
          expect(res.cli.stdout).toContain('summary');
        });

        then('the summary carries guard-parseable count lines', () => {
          expect(res.cli.stdout).toMatch(/\d+\s*blockers?/i);
          expect(res.cli.stdout).toMatch(/\d+\s*nitpicks?/i);
        });

        then('stdout is the RAW base review, NOT the review.by tree (guard drop-in)', () => {
          // the guard-invocation shape: a guard runs `review.by --role X --for $rubric`, captures
          // this stdout, and tallies off it. disintermediation makes it a plain review, so the
          // guard wraps a normal review, not review.by chrome
          // (rule.require.review-by-disintermediates).
          expectDisintermediatedRawReview({
            stdout: res.cli.stdout,
            slug: 'demo-arrow-only',
          });
        });

        then('the guard-shape captured stdout is stable (full snapshot)', () => {
          // the exact stdout a route guard captures when it dispatches `review.by --for` as a
          // peer. the sanitized snapshot proves what the guard tallies: a plain review with a
          // parseable summary, never a review.by tree. proven live end to end in
          // review.by.guard-peer.acceptance.test.ts.
          expect(
            sanitizeRawReviewForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });
      },
    );
  });

  given('[case16] a rubric whose review subprocess malfunctions', () => {
    when('[t0] review.by runs with an unresolvable brain', () => {
      const res = useThen('the rubric is marked malfunctioned', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case16',
          clone: ASSETS_DIR,
        });
        // an unresolvable brain makes the review subprocess fail with no numeric verdict, so
        // runOneReview promotes it to a malfunction rather than a fake 0/0
        const cli = await invokeReviewBySkill({
          role: DEMO_ROLE,
          paths: 'src/clean.ts',
          brain: 'nonexistent/broken/brain',
          cwd,
        });
        return { cli };
      });

      then('the run exits 1 — a malfunction, never a constraint', () => {
        // exact, never `.not.toBe(0)`: a malfunction is the system's to fix (exit 1),
        // and a looser check would pass a constraint exit 2 just as well
        // (rule.require.exit-code-semantics)
        expect(res.cli.code).toBe(1);
      });

      then('stdout marks the rubric malfunctioned, not a clean pass', () => {
        expect(res.cli.stdout).toContain('malfunctioned');
      });

      then('the malfunction tree matches snapshot, its reason named', () => {
        // the reason row names the error class and its message — the line a human acts on.
        // the source frame and the harness chrome that precede it on stderr are skipped
        // (asReviewVerdict), so no machine path reaches the row
        // (rule.require.contract-snapshot-exhaustiveness)
        expect(
          sanitizeReviewByOutputForSnapshot(res.cli.stdout),
        ).toMatchSnapshot();
      });

      then('stderr names the malfunctioned rubric and its reason', () => {
        // the stderr block a driver reads to learn WHY the rubric faulted: the header
        // row and the reason row (asReviewByMalfunctionLines). the child's own stderr
        // follows them — a crash dump whose stack frames carry machine paths — so the
        // snapshot pins the two rows a human acts on and stops there
        // (rule.require.contract-snapshot-exhaustiveness)
        const lines = res.cli.stderr.split('\n');
        const at = lines.findIndex((line) =>
          line.startsWith('💥 MalfunctionError: rubric malfunctioned'),
        );
        expect(at).toBeGreaterThanOrEqual(0);
        expect(
          sanitizeReviewByOutputForSnapshot(lines.slice(at, at + 2).join('\n')),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case18] an unrecognized flag (a typo)', () => {
    when('[t0] review.by runs with a misspelled --rool', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case18',
          clone: ASSETS_DIR,
        });
        return invokeReviewBySkill({
          role: DEMO_ROLE,
          extraArgs: ['--rool mechanic'],
          cwd,
        });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr names the unknown flag, not a silent drop', () => {
        expect(res.stderr).toContain('unknown flag');
        expect(res.stderr).toContain('--rool');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case19] --help prints usage', () => {
    when('[t0] review.by --help runs', () => {
      const res = useThen('it prints and exits clean', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case19',
          clone: ASSETS_DIR,
        });
        return invokeReviewBySkill({ extraArgs: ['--help'], cwd });
      });

      then('exit 0 — help is not an error', () => {
        expect(res.code).toBe(0);
      });

      then('stdout names the command and its required flag', () => {
        expect(res.stdout).toContain('review.by');
        expect(res.stdout).toContain('--role');
      });

      then('the full usage text is stable (usage line + drift snapshot)', () => {
        expect(res.stdout).toContain('usage:');
        expect(res.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case20] a known value-flag given with no value', () => {
    when('[t0] review.by --brain runs with no slug after it', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case20',
          clone: ASSETS_DIR,
        });
        return invokeReviewBySkill({
          role: DEMO_ROLE,
          extraArgs: ['--brain'],
          cwd,
        });
      });

      then('exit 1 — not a silent fall-back to the default', () => {
        expect(res.code).toBe(1);
      });

      // .retired = this case once asserted `expect a value`. retired on purpose: the
      //            refusal now reads `1 flag given with no value: --brain`, the one
      //            counted-noun headline review, review.by, and review._.cost all share
      //            (asCountedNoun), so a value-absent flag is named the same way everywhere
      then('stderr names the value-absent flag', () => {
        expect(res.stderr).toContain('1 flag given with no value: --brain');
        expect(res.stderr).toContain('--brain');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case21] a mechanic role whose rubrics.yml declares the turtle vibe', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review.by --role mechanic runs', () => {
      const res = useThen(
        'the turtle vibe rides the rubrics.yml all the way to stdout',
        async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-case21',
            clone: ASSETS_DIR,
          });
          // a named role (mechanic) declares the ehmpathy seaturtle vibe in its own rubrics.yml —
          // proves the roundtrip end to end: role author's yml → communicator globs role=mechanic
          // → asVibe reads the block → genReviewByStdout renders the swapped glyphs, with the
          // role name carried into the `review.by --role mechanic` anchor
          await setDemoRoleRubrics({
            cwd,
            role: 'mechanic',
            ruleFiles: { [ARROW_RULE_PATH]: ARROW_RULE_BODY },
            rubricsYml: `vibe:
  mascot: 🐢
  artifact: 🐚

rubrics:
  - slug: mech-arrow-only
    rules: [${ARROW_RULE_PATH}]
`,
          });
          const cli = await invokeReviewBySkill({
            role: 'mechanic',
            paths: 'src/clean.ts',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli };
        },
      );

      then('mascot is the seaturtle', () => {
        expect(res.cli.stdout).toContain('🐢');
      });

      then('artifact is the shell', () => {
        expect(res.cli.stdout).toContain('🐚');
      });

      then('the mechanic turtle-vibe contract stdout is stable (snapshot)', () => {
        // clean code gives an all-pass, deterministic run snapped whole — locks the full tree,
        // the swapped glyphs and the `review.by --role mechanic` anchor, so the named-role
        // rubrics.yml roundtrips to the exact render
        expect(
          sanitizeReviewByOutputForSnapshot(res.cli.stdout),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case22] a behaver role whose rubrics.yml declares the beaver vibe', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review.by --role behaver runs', () => {
      const res = useThen(
        'the beaver vibe rides the rubrics.yml all the way to stdout',
        async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-case22',
            clone: ASSETS_DIR,
          });
          // a second named role (behaver) with a different vibe — the beaver + log — shows the
          // vibe is read per-role from its own rubrics.yml, not baked into the engine
          await setDemoRoleRubrics({
            cwd,
            role: 'behaver',
            ruleFiles: { [ARROW_RULE_PATH]: ARROW_RULE_BODY },
            rubricsYml: `vibe:
  mascot: 🦫
  artifact: 🪵

rubrics:
  - slug: behaver-arrow-only
    rules: [${ARROW_RULE_PATH}]
`,
          });
          const cli = await invokeReviewBySkill({
            role: 'behaver',
            paths: 'src/clean.ts',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli };
        },
      );

      then('mascot is the beaver', () => {
        expect(res.cli.stdout).toContain('🦫');
      });

      then('artifact is the log', () => {
        expect(res.cli.stdout).toContain('🪵');
      });

      then('the behaver beaver-vibe contract stdout is stable (snapshot)', () => {
        // a distinct all-pass render shows the second role's vibe roundtrips independently — the
        // beaver glyphs and the `review.by --role behaver` anchor, locked whole
        expect(
          sanitizeReviewByOutputForSnapshot(res.cli.stdout),
        ).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = each argv form the parser reads before it may run a paid review
   * .why = the `--flag=value` split, the repeat check, the stray check, and the
   *        short-flag check each guard a run the human did not ask for. a unit test
   *        proves the parser; this proves the contract refuses before any review
   */
  given('[case23] a flag form or token the parser must read or refuse', () => {
    when('[t0] --rool=mechanic is given in the equals form', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case23-eq-form',
          clone: ASSETS_DIR,
        });
        return invokeReviewBySkill({
          role: DEMO_ROLE,
          extraArgs: ['--rool=mechanic'],
          cwd,
        });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr names the flag split from its value', () => {
        expect(res.stderr).toContain('unknown flag');
        expect(res.stderr).toContain('--rool');
        expect(res.stderr).not.toContain('--rool=mechanic');
      });

      then('no review ran', () => {
        expect(res.stdout).not.toContain('blockers');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });

    when('[t1] --for is given twice', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case23-repeated',
          clone: ASSETS_DIR,
        });
        return invokeReviewBySkill({
          role: DEMO_ROLE,
          extraArgs: ['--for a --for b'],
          cwd,
        });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr names the repeated flag', () => {
        expect(res.stderr).toContain('1 flag given more than once: --for');
      });

      then('no review ran', () => {
        expect(res.stdout).not.toContain('blockers');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });

    when('[t2] a stray positional no flag reads', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case23-stray',
          clone: ASSETS_DIR,
        });
        return invokeReviewBySkill({
          role: DEMO_ROLE,
          extraArgs: ['src/foo.ts'],
          cwd,
        });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr names the stray argument', () => {
        expect(res.stderr).toContain('1 argument no flag reads: src/foo.ts');
      });

      then('no review ran', () => {
        expect(res.stdout).not.toContain('blockers');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });

    when('[t3] an unknown short flag -j', () => {
      const res = useThen('it fails fast', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case23-short',
          clone: ASSETS_DIR,
        });
        return invokeReviewBySkill({
          role: DEMO_ROLE,
          extraArgs: ['-j'],
          cwd,
        });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('stderr names the short flag', () => {
        expect(res.stderr).toContain('unknown flag');
        expect(res.stderr).toContain('-j');
      });

      then('no review ran', () => {
        expect(res.stdout).not.toContain('blockers');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  given('[case-multirule] a single rubric that bundles TWO rule files', () => {
    // regression guard: genReviewRubricCmd once joined a rubric's rules into one
    // comma-separated --rules value, but review's glob does not split on commas, so a two-rule
    // rubric matched no files and malfunctioned. this bundles two rule files into one rubric and
    // asserts the review loads both (a clean pass, never a malfunction).
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] review.by runs the two-rule rubric on clean code',
      () => {
        const res = useThen('both rules load and the rubric passes', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-case-multirule',
            clone: ASSETS_DIR,
          });
          const secondRulePath =
            '.agent/repo=demo/role=demo/briefs/rules/rule.forbid.var-keyword.md';
          await setDemoRoleRubrics({
            cwd,
            ruleFiles: {
              [ARROW_RULE_PATH]: ARROW_RULE_BODY,
              [secondRulePath]:
                '### no-var\n\nnever use the `var` keyword; use const or let.\n\nviolation = blocker\n',
            },
            rubricsYml: `rubrics:
  - slug: demo-two-rules
    rules:
      - ${ARROW_RULE_PATH}
      - ${secondRulePath}
`,
          });
          const cli = await invokeReviewBySkill({
            role: DEMO_ROLE,
            paths: 'src/clean.ts',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli };
        });

        then('exit 0 — both rules loaded, no glob-found-nada malfunction', () => {
          expect(res.cli.code).toBe(0);
        });

        then('the rubric shows a pass mark, never a malfunction row', () => {
          // the mark is checked ON the rubric row, never a bare `✓` (see [case1])
          expect(res.cli.stdout).toContain('r1 demo-two-rules ✓');
          expect(res.cli.stdout).not.toContain('malfunctioned');
        });

        then('the two-rule pass tree is stable (full snapshot)', () => {
          // the pass mark asserts FIRST, so a `--resnap` cannot pin a malfunction tree
          expect(res.cli.stdout).toContain('r1 demo-two-rules ✓');
          expect(
            sanitizeReviewByOutputForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });
      },
    );
  });

  // the end-to-end journey (violation → fix → clean) lives in its own dedicated file,
  // review.by.journey.acceptance.test.ts, per the repo's `.journey.acceptance.test.ts`
  // convention — kept apart from these boundary/error cases so the arc reads as one story.
});
