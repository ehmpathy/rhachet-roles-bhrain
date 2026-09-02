import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import { logOutputHead } from '@src/.test/logOutputHead';
import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

/**
 * .what = raises the per-test budget for this LLM-backed acceptance case
 * .why = jest.acceptance.env sets a 90s default, which fits a deterministic cli case and NOT a real
 *        `--goal exhaustive` review — the exhaustive goal is the SLOWEST review this repo drives, so
 *        it outlasts the default and failed on the clock rather than on the contract. peer
 *        LLM-backed blackbox files carry the same kind of override (review.by.learner = 240s).
 */
// eslint-disable-next-line no-undef
jest.setTimeout(240000);

/**
 * .what = config for probabilistic tests that invoke LLM brains
 * .why = LLM responses can timeout or vary; retry ensures CI stability
 *
 * @see .agent/repo=.this/role=any/briefs/rule.require.repeatable-for-llm-tests.md
 */
const REPEATABLE_CONFIG = {
  attempts: 3,
  criteria: process.env.CI ? 'SOME' : 'EVERY',
} as const;

describe('review.acceptance', () => {
  given('[case3] mechanic codebase with dirty code', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review skill on dirty.ts with goal=exhaustive', () => {
      const res = useThen('invoke review skill with exhaustive goal', async () => {
        // clone fixture to temp dir with git initialized
        const tempDir = genTempDirForRhachet({ slug: 'review-exh-dirty', clone: ASSETS_DIR });
        const outputPath = path.join(tempDir, 'review-exhaustive-dirty.md');

        // link the reviewer role via rhachet
        await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });

        // invoke skill with exhaustive goal
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          paths: 'src/dirty.ts',
          output: outputPath,
          focus: 'push',
          goal: 'exhaustive',
          brain: 'fireworks/deepseek/v4-flash',
          cwd: tempDir,
        });

        // read output
        const review = await fs.readFile(outputPath, 'utf-8');

        // log for visibility
        logOutputHead({ label: 'review-exhaustive-dirty.md', output: review });

        return { cli, review };
      });

      then('cli completes successfully', async () => {
        expect(res.cli.stderr).not.toContain('Error');
      });

      then('review includes blockers', async () => {
        expect(res.review.toLowerCase()).toContain('blocker');
      });
    });
  });
});
