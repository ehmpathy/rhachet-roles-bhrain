import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  DEMO_ROLE,
  genReviewByFixture,
  invokeReviewByViaRhx,
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
 * .what = acceptance coverage for the REAL `rhx review.by --repo bhrain --role reviewer` dispatch
 * .why = the review.by.acceptance suite invokes review.by.sh directly, BELOW rhachet's dispatch —
 *        so it never proves that a `rhx` forward of --repo/--role/--skill into the skill's argv is
 *        tolerated. that forward is what a real user (and a role's own wrapper) hits, and it broke
 *        the base until the parser learned to tolerate the dispatch flags. this suite dispatches
 *        through `rhx` for real, to close that blind spot.
 */
describe('review.by.dispatch.acceptance', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // dispatch-tolerance boundaries — deterministic, no LLM
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-rhx1] the base dispatched via rhx against an absent target role', () => {
    when('[t0] rhx review.by --repo bhrain --role reviewer -- --role ghost runs', () => {
      const res = useThen('it fails fast on the target role, not the dispatch flags', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-rhx1',
          clone: ASSETS_DIR,
        });
        return invokeReviewByViaRhx({ targetRole: 'ghost', cwd });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('the forwarded --repo/--skill are tolerated (no unknown-flag error)', () => {
        // the whole point: rhachet forwarded --skill/--repo/--role into argv, and the base
        // must NOT reject them. if it did, we would see an unknown-flag error instead of the
        // real target-role fault below.
        expect(res.stderr).not.toContain('unknown flag');
        expect(res.stderr).not.toContain('--skill');
        expect(res.stderr).not.toContain('--repo');
      });

      then('the error names the absent target role (last-wins reached the parser)', () => {
        // `-- --role ghost` overrode the forwarded dispatch `--role reviewer` (last-wins), so the
        // base tried to run ghost's rubrics and failed fast — proof the passthrough arg landed.
        expect(res.stderr).toContain('role not found');
        expect(res.stderr).toContain('role=ghost');
      });
    });
  });

  given('[case-rhx2] a genuine typo passed through the dispatch layer', () => {
    when('[t0] rhx ... -- --role demo --rool oops runs', () => {
      const res = useThen('it still errors loud on the typo', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-rhx2',
          clone: ASSETS_DIR,
        });
        return invokeReviewByViaRhx({
          targetRole: DEMO_ROLE,
          extraArgs: ['--rool oops'],
          cwd,
        });
      });

      then('exit 1', () => {
        expect(res.code).toBe(1);
      });

      then('the typo is named, not silently dropped', () => {
        // tolerance is SURGICAL: only the known dispatch flags (--skill/--repo) are ignored; a
        // real typo still surfaces, so the dispatch layer does not become a hole for mistakes.
        expect(res.stderr).toContain('unknown flag');
        expect(res.stderr).toContain('--rool');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // dispatched happy path — LLM-backed (when.repeatably)
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-rhx3] the base dispatched via rhx against clean code', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] rhx review.by --repo bhrain --role reviewer -- --role demo runs',
      () => {
        const res = useThen('the full dispatch chain runs and passes', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-rhx3',
            clone: ASSETS_DIR,
          });
          const cli = await invokeReviewByViaRhx({
            targetRole: DEMO_ROLE,
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

        then('the dispatched positive-path stdout is stable (snapshot)', () => {
          // proves the treestruct a real `rhx` user sees is identical to the direct-shell path —
          // the dispatch layer adds no noise to the contract output (contract exhaustiveness).
          expect(
            sanitizeReviewByOutputForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });
      },
    );
  });
});
