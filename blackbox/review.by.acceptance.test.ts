import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
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
  criteria: 'SOME',
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
 * .what = the first non-empty line of a captured stderr — the human-readable message
 * .why = a fail-fast error prints `✋ <message>` first, then a metadata block that carries
 *        the run's tempdir cwd (non-deterministic). the message line is deterministic, so it
 *        is what a drift snapshot captures — reword/typo drift surfaces, tempdir noise does not.
 */
const asStderrMessageLine = (input: { stderr: string }): string =>
  input.stderr.split('\n').find((line) => line.trim() !== '') ?? '';

/**
 * .what = asserts a `--for` run DISINTERMEDIATED to the base review's stdout (no review.by tree)
 * .why = the single-scope contract (rule.require.review-by-disintermediates): `review.by --for`
 *        must emit the base `rhx review` stdout verbatim, so a route guard peer slot wraps a
 *        NORMAL review — never a review.by tree nested inside the guard tree (review info doubled).
 *        we prove BOTH halves: the base-review markers ARE present, and every review.by-tree
 *        marker is ABSENT. this is the drop-in-for-plain-review proof.
 * .note = we assert markers, not a byte-exact snapshot: the base review's stdout carries volatile
 *         token/cost/latency/log-path values, so a full snapshot would fight
 *         rule.require.repeatable-for-llm-tests. the base review's own stdout SHAPE is snapshotted
 *         at the review layer (genReviewOutputStdout tests); here we prove review.by hands it
 *         through untouched.
 */
const expectDisintermediatedRawReview = (input: {
  stdout: string;
  slug: string;
}): void => {
  // base-review markers PRESENT — the metrics blocks + the `review:` output-path line are printed
  // by genReviewOutputStdout (the base review), never by the review.by tree
  expect(input.stdout).toContain('metrics');
  expect(input.stdout).toContain(`rubric=${input.slug}.md`);
  // review.by-tree chrome ABSENT — no `review.by --role` anchor, no `rubrics` bucket connector
  // (the `r{n} <slug>` rows only live under that bucket, so its absence proves theirs too)
  expect(input.stdout).not.toContain('review.by --role');
  expect(input.stdout).not.toMatch(/[├└]─ rubrics\b/);
};

describe('review.by.acceptance', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // error / fail-fast boundaries — deterministic, no LLM (all exit 1)
  // ─────────────────────────────────────────────────────────────────────────

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

      then('stderr names the value-absent flag', () => {
        expect(res.stderr).toContain('expect a value');
        expect(res.stderr).toContain('--brain');
      });

      then('the error message is stable (exit 1 + drift snapshot)', () => {
        expect(res.code).toBe(1);
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // outcome boundaries — LLM-backed (when.repeatably)
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
            brain: 'fireworks/deepseek/v4-flash',
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
          expect(res.cli.stdout).toContain('demo-arrow-only');
          expect(res.cli.stdout).toContain('✓');
        });

        then('default vibe: owl mascot + magnifier artifact', () => {
          expect(res.cli.stdout).toContain('🦉');
          expect(res.cli.stdout).toContain('🔍');
        });

        then('the positive-path contract stdout is stable (snapshot)', () => {
          // when every rubric passes, review.by stdout is deterministic: the review
          // body is never echoed here — only the header + rubric tree with ✓ marks and
          // no issue paths. so a full snapshot guards the success output structure
          // against regression, per rule.require.contract-snapshot-exhaustiveness.
          // sanitized like the other stdout snapshots so the ephemeral live-progress lines
          // (`… — reviews…`) are stripped — the snapshot captures the contract tree, not the
          // status feedback (that is asserted explicitly in the learner suite).
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
            brain: 'fireworks/deepseek/v4-flash',
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
          // the findings variant (owl "needs your talons" tier) is the other key user
          // contract output beside the all-pass path (case1). the single-violation fixture
          // pins the verdict deterministically (1 blocker / 0 nitpicks), so the snapshot
          // shows REAL counts (not a mask) and guards the whole tree — the blocker-tier
          // header, the ✗ rubric subtree, the summary block — against regression
          // (rule.require.contract-snapshot-exhaustiveness, rule.require.acceptance-journey-coverage).
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
          brain: 'fireworks/deepseek/v4-flash',
          cwd,
        });
        return { cli };
      });

      then('exit 0', () => {
        expect(res.cli.code).toBe(0);
      });

      then('stdout is the RAW base review, NOT the review.by tree', () => {
        // the single-scope contract: `--for` disintermediates to the base review's stdout, so a
        // route guard peer slot wraps a normal review — not a review.by tree nested in the guard
        // tree. rule.require.review-by-disintermediates.
        expectDisintermediatedRawReview({
          stdout: res.cli.stdout,
          slug: 'demo-arrow-only',
        });
      });

      then('the disintermediated raw-review stdout is stable (full snapshot)', () => {
        // the rubric-SCOPED half of the exhaustive matrix (the aggregate/global half is case1/2/13).
        // clean code → a deterministic 0/0 verdict, so once the volatile telemetry blocks are
        // dropped (sanitizeRawReviewForSnapshot), the FULL disintermediated shape snapshots stably:
        // the `let's review` scope block + verdict header + `review:` path + summary counts, with NO
        // review.by tree. a reviewer vibechecks the exact drop-in-for-plain-review output here.
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
          brain: 'fireworks/deepseek/v4-flash',
          cwd,
        });
        return { cli };
      });

      then('exit 2 (blockers present)', () => {
        expect(res.cli.code).toBe(2);
      });

      then('stdout is the RAW base review with findings, NOT the review.by tree', () => {
        // the findings path also disintermediates: the base review's own blocker-tier stdout is
        // handed through verbatim, so a guard tallies off a normal review.
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
        // verdict (1 blocker / 0 nitpicks); the findings PROSE lives in the review FILE, not stdout
        // (genReviewOutputStdout echoes only header + review path + summary), so the sanitized full
        // stdout is deterministic — the `needs your talons` tier, the `review:` path, and the real
        // blocker count, with NO review.by tree. proves the guard-consumed dirty stdout is a plain
        // review. rule.require.review-by-disintermediates.
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
            brain: 'fireworks/deepseek/v4-flash',
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
          // output path (`…/rubric=r-one.md`) — so r-one shows and r-two never does.
          expect(res.cli.stdout).toContain('r-one');
          expect(res.cli.stdout).not.toContain('r-two');
        });

        then('only r-one produced an output file', () => {
          expect(res.outOne).not.toBeNull();
          expect(res.outTwo).toBeNull();
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
          brain: 'fireworks/deepseek/v4-flash',
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
    });
  });

  given('[case-multirule] a single rubric that bundles TWO rule files', () => {
    // .why = regression guard for the comma-join defect: genReviewRubricCmd once joined a rubric's
    //        rules into ONE comma-separated --rules value, but review's glob (globby) does not split
    //        on commas, so a two-rule rubric matched no files and malfunctioned. every prior case
    //        used a single-rule rubric, so the bug hid. this case bundles two real rule files into
    //        one rubric and asserts the review LOADS BOTH (a clean pass, never a 💥 malfunction).
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
            brain: 'fireworks/deepseek/v4-flash',
            cwd,
          });
          return { cli };
        });

        then('exit 0 — both rules loaded, no glob-found-nada malfunction', () => {
          expect(res.cli.code).toBe(0);
        });

        then('the rubric shows a pass mark, never a malfunction row', () => {
          expect(res.cli.stdout).toContain('demo-two-rules');
          expect(res.cli.stdout).toContain('✓');
          expect(res.cli.stdout).not.toContain('malfunctioned');
        });
      },
    );
  });

  given('[case14] a prefer-severity rubric never forces a blocker exit', () => {
    // .why = a `prefer` rubric can only yield nitpicks, never blockers. so however the
    //        reviewer scores this run, the exit must stay 0 — a nitpick must not escalate to
    //        the constraint exit (2). the nitpicks-only STDOUT shape is covered
    //        deterministically by the genReviewByStdout unit snapshot; here we assert the
    //        exit-code boundary end-to-end, robust to whether the LLM emits a nitpick at all.
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
            brain: 'fireworks/deepseek/v4-flash',
            cwd,
          });
          return { cli };
        });

        then('exit 0 — a nitpick never escalates to the blocker exit (2)', () => {
          expect(res.cli.code).toBe(0);
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
            brain: 'fireworks/deepseek/v4-flash',
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
          // this stdout, and tallies off it. disintermediation makes that captured stdout a plain
          // review — so the guard wraps a normal review, not review.by chrome.
          // rule.require.review-by-disintermediates.
          expectDisintermediatedRawReview({
            stdout: res.cli.stdout,
            slug: 'demo-arrow-only',
          });
        });

        then('the guard-shape captured stdout is stable (full snapshot)', () => {
          // this is the EXACT stdout a route guard captures when it dispatches `review.by --for` as
          // a peer (the main-consumer shape). the sanitized full snapshot proves what the guard
          // tallies off: a plain review with a parseable summary, never a review.by tree. the
          // end-to-end guard capture is proven live in review.by.guard-peer.acceptance.test.ts.
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
        // an unresolvable brain makes the review subprocess fail — no numeric
        // verdict, so runOneReview promotes it to a malfunction (never a fake 0/0)
        const cli = await invokeReviewBySkill({
          role: DEMO_ROLE,
          paths: 'src/clean.ts',
          brain: 'nonexistent/broken/brain',
          cwd,
        });
        return { cli };
      });

      then('the run does not exit 0 (a malfunction is surfaced)', () => {
        expect(res.cli.code).not.toBe(0);
      });

      then('stdout marks the rubric malfunctioned, not a clean pass', () => {
        expect(res.cli.stdout).toContain('malfunctioned');
      });

      // no full-tree snapshot here (unlike the deterministic contract cases): the malfunction
      // reason row echoes the brain-resolution error text, which varies by machine/runtime, so a
      // byte-exact acceptance snapshot would fight rule.require.repeatable-for-llm-tests. the
      // malfunction TREE STRUCTURE (💥 row + reason child + uncolored zero summary) is snapped
      // deterministically at the unit grain instead — genReviewByStdout.test.ts case8.
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
          brain: 'fireworks/deepseek/v4-flash',
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
        // clean code → all-pass, so this variant is deterministic and snapped whole; the
        // snapshot locks the full tree around the swapped glyphs, not just their presence, so
        // an indent/structure regression around the override is caught (contract exhaustiveness)
        expect(
          sanitizeReviewByOutputForSnapshot(res.cli.stdout),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case18] a mechanic role whose rubrics.yml declares the turtle vibe', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review.by --role mechanic runs', () => {
      const res = useThen(
        'the turtle vibe rides the rubrics.yml all the way to stdout',
        async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-case18',
            clone: ASSETS_DIR,
          });
          // a NAMED role (mechanic) declares the ehmpathy seaturtle vibe in its own rubrics.yml —
          // this proves the roundtrip end to end: the yml the role author writes → the communicator
          // globs role=mechanic → asVibe reads the block → genReviewByStdout renders the swapped
          // glyphs, with the role name carried into the `review.by --role mechanic` anchor.
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
            brain: 'fireworks/deepseek/v4-flash',
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
        // clean code → all-pass, so this variant is deterministic and snapped whole; the snapshot
        // locks the full tree — the swapped glyphs AND the `review.by --role mechanic` anchor — so
        // the named-role rubrics.yml roundtrips to the exact render.
        expect(
          sanitizeReviewByOutputForSnapshot(res.cli.stdout),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case19] a behaver role whose rubrics.yml declares the beaver vibe', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review.by --role behaver runs', () => {
      const res = useThen(
        'the beaver vibe rides the rubrics.yml all the way to stdout',
        async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-case19',
            clone: ASSETS_DIR,
          });
          // a SECOND named role (behaver) with a DIFFERENT vibe — the beaver + log — shows the
          // vibe is read per-role from its own rubrics.yml, not baked into the engine: two roles,
          // two yml blocks, two distinct renders.
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
            brain: 'fireworks/deepseek/v4-flash',
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
        // beaver glyphs and the `review.by --role behaver` anchor, locked whole.
        expect(
          sanitizeReviewByOutputForSnapshot(res.cli.stdout),
        ).toMatchSnapshot();
      });
    });
  });

  // the end-to-end journey (violation → fix → clean) lives in its own dedicated file,
  // review.by.journey.acceptance.test.ts, per the repo's `.journey.acceptance.test.ts`
  // convention — kept apart from these boundary/error cases so the arc reads as one story.
});
