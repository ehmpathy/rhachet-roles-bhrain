import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  DEMO_ROLE,
  genReviewByFixture,
  invokeReviewByWrapper,
  sanitizeReviewByOutputForSnapshot,
} from './.test/invokeReviewBySkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-review-by');

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
 * .what = acceptance coverage for the wrapper-extends-base usecase
 * .why = the whole point of the base engine is that each role ships its OWN thin review.by that
 *        bakes in its role and delegates to the base. the demo role's wrapper (a fixture asset)
 *        does exactly that: `rhx review.by --repo bhrain --role reviewer -- --role demo`. these
 *        cases invoke that wrapper with the SAME forwarded dispatch flags rhachet injects, so the
 *        full chain runs for real — wrapper → base → the demo role's rubrics — the layered
 *        invocation a real role author relies on.
 */
describe('review.by.wrapper.acceptance', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // wrapper forwards user args to the base — deterministic, no LLM
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-wrap1] the wrapper forwards a --for the base cannot resolve', () => {
    when('[t0] the demo wrapper runs with --for ghost', () => {
      const res = useThen('the base fails fast on the absent rubric', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-wrap1',
          clone: ASSETS_DIR,
        });
        return invokeReviewByWrapper({
          role: DEMO_ROLE,
          extraArgs: ['--for ghost'],
          cwd,
        });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('the base names the absent rubric (proof --for reached the base)', () => {
        // the wrapper forwarded the user's `--for ghost` down to the base; the base ran demo's
        // rubrics.yml, found no `ghost` rubric, and failed fast — so the user arg traversed the
        // whole wrapper → base chain.
        expect(res.stderr).toContain('rubric not found: ghost');
      });

      then('the forwarded dispatch flags did not trip the base parser', () => {
        // the wrapper passed rhachet's injected --skill/--role through to the base; if the base
        // rejected them we would see an unknown-flag error, not the rubric fault above.
        expect(res.stderr).not.toContain('unknown flag');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // wrapper happy path — LLM-backed (when.repeatably)
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-wrap2] the demo wrapper runs against clean code', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] rhx review.by --role demo (via the demo wrapper) runs',
      () => {
        const res = useThen('the wrapper → base → demo-rubric chain passes', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-wrap2',
            clone: ASSETS_DIR,
          });
          const cli = await invokeReviewByWrapper({
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

        then('the demo rubric ran and shows a pass mark', () => {
          expect(res.cli.stdout).toContain('demo-arrow-only');
          expect(res.cli.stdout).toContain('✓');
        });

        then('the wrapper-dispatched stdout is stable (snapshot)', () => {
          // proves a role author who ships this one-line wrapper gets the identical owl treestruct
          // the base produces — the wrapper adds no drift, only bakes in its role (exhaustiveness).
          expect(
            sanitizeReviewByOutputForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });
      },
    );
  });
});
