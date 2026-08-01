import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  DEMO_ROLE,
  genReviewByFixture,
  invokeReviewBySkill,
  sanitizeReviewByOutputForSnapshot,
} from './.test/invokeReviewBySkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-review-by');

/**
 * .what = config for probabilistic cases that invoke LLM review subprocesses
 * .why = LLM responses vary; retry keeps CI green while it still checks the contract
 * @see .agent/repo=.this/role=any/briefs/rule.require.repeatable-for-llm-tests.md
 */
const REPEATABLE_CONFIG = {
  attempts: 3,
  criteria: 'SOME',
} as const;

/**
 * .what = the end-to-end journey for review.by — a violation is caught, fixed, then clean.
 * .why = journeys ride in a dedicated `.journey.acceptance.test.ts` file (the repo's journey
 *        convention) so the full dirty→fix→clean arc reads as one story, apart from the
 *        boundary/error cases in review.by.acceptance.test.ts.
 */
describe('review.by.journey.acceptance', () => {
  given('[case17] journey: violation to fix to clean', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] dirty then fixed', () => {
      const journey = useThen('review.by reflects the fix', async () => {
        const cwd = await genReviewByFixture({
          slug: 'review-by-case17',
          clone: ASSETS_DIR,
        });

        // [t1] violations present → blockers, exit 2
        const dirty = await invokeReviewBySkill({
          role: DEMO_ROLE,
          paths: 'src/dirty.ts',
          brain: 'fireworks/deepseek/v4-flash',
          cwd,
        });

        // [t2] fixture updated to clean (arrows only)
        await fs.writeFile(
          path.join(cwd, 'src/dirty.ts'),
          'export const calc = (input: { items: number[] }) => input.items.reduce((s, x) => s + x, 0);\n',
        );

        // [t3] clean → all pass, exit 0
        const clean = await invokeReviewBySkill({
          role: DEMO_ROLE,
          paths: 'src/dirty.ts',
          brain: 'fireworks/deepseek/v4-flash',
          cwd,
        });

        return { dirty, clean };
      });

      then('[t1] the violation run exits 2', () => {
        expect(journey.dirty.code).toBe(2);
      });

      // every journey step carries a snapshot so a reviewer can follow the whole
      // dirty→clean arc from the snapshots alone (rule.require.snapshot-every-journey-step).
      // the single-violation fixture pins the dirty verdict deterministically (1 blocker /
      // 0 nitpicks), so the snapshot shows REAL counts and pins the whole tree — the owl
      // blocker-tier header, the ✗ rubric subtree, the summary block.
      then('[t1] the violation run stdout is stable (snapshot)', () => {
        expect(
          sanitizeReviewByOutputForSnapshot(journey.dirty.stdout),
        ).toMatchSnapshot();
      });

      then('[t3] the fixed run exits 0', () => {
        expect(journey.clean.code).toBe(0);
      });

      then('[t3] the fixed run shows the all-clear owl vibe', () => {
        expect(journey.clean.stdout).toContain('not even a vole');
      });

      // the fixed step's all-pass stdout is deterministic (no counts) — snapshot it whole
      then('[t3] the fixed run stdout is stable (snapshot)', () => {
        expect(
          sanitizeReviewByOutputForSnapshot(journey.clean.stdout),
        ).toMatchSnapshot();
      });
    });
  });
});
