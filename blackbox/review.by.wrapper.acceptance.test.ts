import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';
import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';

import {
  asStderrMessageLine,
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
  criteria: process.env.CI ? 'SOME' : 'EVERY',
} as const;

/**
 * .what = acceptance coverage for the wrapper-extends-base usecase
 * .why = the whole point of the base engine is that each role ships its OWN thin review.by that
 *        delegates to the base. the demo role's wrapper (a fixture asset) does exactly that, in
 *        the node-direct shape rule.require.review-by-wrapper-pattern prescribes:
 *        `exec node -e "import('rhachet-roles-bhrain/cli/review.by')…" -- "$@"`. these cases
 *        invoke that wrapper with the SAME forwarded dispatch flags rhachet injects, so the full
 *        chain runs for real — wrapper → base cli → the demo role's rubrics — the layered
 *        invocation a real role author relies on.
 */
describe('review.by.wrapper.acceptance', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // the wrapper a role author would copy — deterministic, no LLM
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-wrap0] the demo wrapper a role author would copy', () => {
    when('[t0] its delegation line is read', () => {
      // wrapped in an object: the useThen proxy forwards fields, never a bare string
      const read = useThen('the fixture wrapper is read', async () => ({
        wrapper: await readFile(
          path.join(ASSETS_DIR, '.agent/repo=demo/role=demo/skills/review.by.sh'),
          'utf8',
        ),
      }));

      then('it delegates node-direct, the one shape the wrapper rule prescribes', () => {
        // a role author copies this fixture. a second `rhx` dispatch inside it would print a
        // doubled `🪨 run solid skill` banner (rule.require.review-by-wrapper-pattern)
        expect(read.wrapper).toContain(
          `exec node -e "import('rhachet-roles-bhrain/cli/review.by').then(m => m.reviewBy())" -- "$@"`,
        );
        expect(read.wrapper).not.toMatch(/^exec rhx /m);
      });
    });
  });

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

      then('the refusal message renders whole (snapshot)', () => {
        expect(asStderrMessageLine({ stderr: res.stderr })).toMatchSnapshot();
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
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli, cwd };
        });

        then('exit 0', () => {
          expect(res.cli.code).toBe(0);
        });

        then('no warmer was spawned — the wrapper never opts its rubrics in', () => {
          // `review.by` spawns one `rhx review` per rubric (`genReviewRubricCmd`) with no
          // `--warmer` flag, so each child settles under the default plan, `off`. this clamps
          // that the WRAPPER never opts in: a `--warmer on` added to the rubric command would
          // leave a pid under this dir or a `warmer:` aside on stderr
          // (1.vision.experience.case=7). the seam's own on-vs-off discriminator — that a
          // no-lane round under `on` refuses aloud, and under `off` says naught — is clamped
          // where both states can be driven: `setReviewWarmerOfRound.test.ts`
          const dirOfWarmers = path.join(
            res.cwd,
            '.agent/.cache/repo=bhrain/role=reviewer/skill=review/warmers',
          );
          expect(existsSync(dirOfWarmers)).toBe(false);
          expect(res.cli.stderr).not.toContain('warmer:');
        });

        then('the header shows the all-clear owl vibe', () => {
          expect(res.cli.stdout).toContain('not even a vole');
        });

        then('the demo rubric ran and shows a pass mark', () => {
          // the mark is checked ON the rubric row: a bare `✓` is satisfied by the
          // `0 nitpicks ✓` a REJECTED rubric also prints (rule.forbid.failhide)
          expect(res.cli.stdout).toContain('r1 demo-arrow-only ✓');
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
