import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  genReviewByFixture,
  invokeReviewByRoleViaRhx,
  invokeReviewBySkill,
} from './.test/invokeReviewBySkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-review-by');

/**
 * .what = raise the per-test timeout above the 90s shared default (jest.acceptance.env.ts)
 * .why = [case-all] drives BOTH learner rubrics serially in one action — two back-to-back LLM
 *        reviews (~45s each) that sit right at the 90s boundary and time out under any load. a
 *        single test that drives multiple serial reviews legitimately needs ~2× the budget; this
 *        gives headroom for real latency, it does not mask a hang (a genuine stall still fails,
 *        just at 240s). scoped to THIS file so other acceptance suites keep the tighter default.
 */
// eslint-disable-next-line no-undef
jest.setTimeout(240000);

/**
 * .what = config for probabilistic cases that invoke LLM review subprocesses
 * .why = LLM responses vary; retry keeps CI green while it still verifies the contract
 * @see .agent/repo=.this/role=any/briefs/rule.require.repeatable-for-llm-tests.md
 */
const REPEATABLE_CONFIG = {
  attempts: 3,
  criteria: 'SOME',
} as const;

/**
 * .what = acceptance coverage for review.by against the REAL shipped learner role
 * .why = the demo fixture proves the engine; this proves review.by drives a real role's review
 *        set end-to-end. the learner ships two rubrics — term-application (3 rules: ambiguity,
 *        disadherence, inconsistency) and term-aggregation (1 rule: itemization). these cases
 *        cover BOTH grains the user asked for: each rubric alone via --for, and all rubrics at
 *        once. the fixture links the learner role so its rubrics.yml rule globs match.
 *
 * .note = the learner is linked beside reviewer via genReviewByFixture({ linkRoles: ['learner'] }),
 *         so `.agent/repo=bhrain/role=learner/briefs/…rule…md` matches in the temp cwd.
 */
describe('review.by.learner.acceptance', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // the ergonomic form — `rhx review.by --role learner` resolves the learner's OWN wrapper
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-wrapper] the clean `rhx review.by --role learner` form', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] rhx resolves the learner-owned review.by wrapper',
      () => {
        const res = useThen('the wrapper runs and delegates to the base', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-learner-wrapper',
            clone: ASSETS_DIR,
            linkRoles: ['learner'],
          });
          const cli = await invokeReviewByRoleViaRhx({
            role: 'learner',
            paths: 'src/clean.ts',
            brain: 'fireworks/deepseek/v4-flash',
            cwd,
          });
          return { cli };
        });

        then('exit 0 — the wrapper resolved, no "no skill found" error', () => {
          // this is the crux of the wrapper pattern: `rhx review.by --role learner` MUST find the
          // learner's OWN review.by skill (its wrapper). if the learner shipped no wrapper, rhachet
          // would fail with `no skill "review.by" found with --role learner` and a nonzero exit.
          expect(res.cli.code).toBe(0);
          expect(res.cli.stderr).not.toContain('no skill');
        });

        then('both learner rubrics ran via the delegated base', () => {
          expect(res.cli.stdout).toContain('term-application');
          expect(res.cli.stdout).toContain('term-aggregation');
          expect(res.cli.stdout).toContain('✓');
        });
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // all rubrics at once — the full learner review set
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-all] the learner review set on clean code', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] review.by --role learner (no --for) runs both rubrics',
      () => {
        const res = useThen('both rubrics run and pass', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-learner-all',
            clone: ASSETS_DIR,
            linkRoles: ['learner'],
          });
          const cli = await invokeReviewBySkill({
            role: 'learner',
            paths: 'src/clean.ts',
            brain: 'fireworks/deepseek/v4-flash',
            cwd,
          });
          return { cli };
        });

        then('exit 0', () => {
          expect(res.cli.code).toBe(0);
        });

        then('BOTH rubrics appear in the tree, each with a pass mark', () => {
          // proves review.by enumerated the two-rubric set AND that the 3-rule term-application
          // rubric loaded all its rules (the multi-rule comma-join path) — never a malfunction.
          expect(res.cli.stdout).toContain('term-application');
          expect(res.cli.stdout).toContain('term-aggregation');
          expect(res.cli.stdout).toContain('✓');
          expect(res.cli.stdout).not.toContain('malfunctioned');
        });

        then('stdout STREAMS each rubric as an incremental peer-style row — no silent wait', () => {
          // the regression this locks in: review.by used to capture each rubric's subprocess
          // output silently and print only the final tree, so a human faced a multi-minute silent
          // terminal (rule.require.status-feedback). the cli now streams each rubric to STDOUT as
          // the SAME incremental peer-style row route.stone.set renders (formatGuardReviewerTree):
          // a `r{n}: {slug}` header + a `given:` line per rubric. assert both rubrics stream that
          // way, so both the feedback AND its peer-review conformance cannot regress.
          expect(res.cli.stdout).toContain('r1: term-application');
          expect(res.cli.stdout).toContain('r2: term-aggregation');
          // the peer-style `given:` line — proof it went through formatGuardReviewerTree, not a
          // bespoke progress line
          expect(res.cli.stdout).toContain(
            'given: .reviews/by=learner/rubric=term-application.md',
          );
        });
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // per-rubric via --for — the application rubric alone
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-app] --for term-application on clean code', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] only the application rubric runs',
      () => {
        const res = useThen('the application rubric runs alone and passes', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-learner-app',
            clone: ASSETS_DIR,
            linkRoles: ['learner'],
          });
          const cli = await invokeReviewBySkill({
            role: 'learner',
            for: 'term-application',
            paths: 'src/clean.ts',
            brain: 'fireworks/deepseek/v4-flash',
            cwd,
          });
          return { cli };
        });

        then('exit 0', () => {
          expect(res.cli.code).toBe(0);
        });

        then('disintermediates to the RAW review; only term-application, aggregation isolated out', () => {
          // `--for` disintermediates to the base review's stdout (no review.by tree), so a route
          // guard peer slot wraps a normal review. rule.require.review-by-disintermediates.
          expect(res.cli.stdout).not.toContain('review.by --role'); // no review.by chrome
          expect(res.cli.stdout).toContain('term-application'); // via the base review's `review:` path
          expect(res.cli.stdout).not.toContain('term-aggregation'); // the other rubric never ran
        });
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // per-rubric via --for — the aggregation rubric alone
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-agg] --for term-aggregation on clean code', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] only the aggregation rubric runs',
      () => {
        const res = useThen('the aggregation rubric runs alone and passes', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-learner-agg',
            clone: ASSETS_DIR,
            linkRoles: ['learner'],
          });
          const cli = await invokeReviewBySkill({
            role: 'learner',
            for: 'term-aggregation',
            paths: 'src/clean.ts',
            brain: 'fireworks/deepseek/v4-flash',
            cwd,
          });
          return { cli };
        });

        then('exit 0', () => {
          expect(res.cli.code).toBe(0);
        });

        then('disintermediates to the RAW review; only term-aggregation, application isolated out', () => {
          // `--for` disintermediates to the base review's stdout (no review.by tree), so a route
          // guard peer slot wraps a normal review. rule.require.review-by-disintermediates.
          expect(res.cli.stdout).not.toContain('review.by --role'); // no review.by chrome
          expect(res.cli.stdout).toContain('term-aggregation'); // via the base review's `review:` path
          expect(res.cli.stdout).not.toContain('term-application'); // the other rubric never ran
        });
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // detection — the application rubric BITES on a term-dirty file
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-detect] --for term-application on a term-dirty file', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] the application rubric detects a term violation',
      () => {
        const res = useThen('it finds a blocker on the dirty terms', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-learner-detect',
            clone: ASSETS_DIR,
            linkRoles: ['learner'],
          });
          const cli = await invokeReviewBySkill({
            role: 'learner',
            for: 'term-application',
            paths: 'src/dirty.terms.ts',
            brain: 'fireworks/deepseek/v4-flash',
            cwd,
          });
          return { cli };
        });

        then('exit 2 — the rubric bites, it does not rubber-stamp', () => {
          // dirty.terms.ts names one concept (reserved lesson slot) with three words and overloads
          // 'session' for two concepts. the rubric must find at least one blocker, as proof it truly
          // reviews rather than a pass of all input. (a real detection, not a fake-0/0.)
          expect(res.cli.code).toBe(2);
        });

        then('the header shows the blocker-tier owl vibe + a parseable summary', () => {
          expect(res.cli.stdout).toContain('needs your talons');
          expect(res.cli.stdout).toMatch(/\d+\s*blockers?/i);
          expect(res.cli.stdout).toMatch(/\d+\s*nitpicks?/i);
        });
      },
    );
  });
});
