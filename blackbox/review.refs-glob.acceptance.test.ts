import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import { logOutputHead } from '@src/.test/logOutputHead';
import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';
import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';
import { asReviewMetricsExpectedBlock } from './.test/invokeReviewBySkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

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

describe('review.refs-glob.acceptance', () => {
  /**
   * usecase.2: pass multiple refs via glob pattern
   */
  given('[case1] glob pattern matches multiple ref files', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review skill invoked with --refs set to glob pattern', () => {
      const res = useThen('invoke review skill with glob refs', async () => {
        // clone fixture to temp dir
        const tempDir = genTempDirForRhachet({
          slug: 'review-refs-glob',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-refs-glob.md');

        // link the reviewer role via rhachet
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // invoke skill with glob pattern for refs
        // behavior/getWeather/*.md matches criteria.blackbox.md and criteria.blueprint.md
        const cli = await invokeReviewSkill({
          rules: 'rules/rule.verify-refs-included.md',
          paths: 'src/clean.ts',
          refs: 'behavior/getWeather/*.md',
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd: tempDir,
        });

        // log cli output for debug
        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        // read output
        const review = await fs.readFile(outputPath, 'utf-8');

        // log for visibility
        logOutputHead({ label: 'review-refs-glob.md', output: review });

        return { cli, review };
      });

      then('cli completes successfully', async () => {
        expect(res.cli.stderr).not.toContain('Error');
      });

      then('cli stdout shows refs count = 2 in metrics', async () => {
        // the glob matches both criteria files, so the files tree reads `refs: 2`.
        // a bare `refs` match would pass on one file, or on the flag echo alone
        expect(res.cli.stdout).toContain('refs: 2');
      });

      then('the metrics.expected block matches its snapshot (computed before the brain)', () => {
        // the scope tree and estimate are deterministic; the verdict summary is the brain's
        expect(asReviewMetricsExpectedBlock({ stdout: res.cli.stdout })).toMatchSnapshot();
      });

      then('review contains no blockers (all refs accessible)', async () => {
        // check for actual blocker issues (# blocker.N:) not just the word in summary
        expect(res.review.toLowerCase()).not.toMatch(/# blocker\.\d+:/);
        expect(res.review).toContain('0 blockers');
      });
    });
  });

  /**
   * usecase.7: multiple --refs via repeated flags
   */
  given('[case2] multiple refs via repeated --refs flags', () => {
    when.repeatably(REPEATABLE_CONFIG)('[t0] review skill invoked with --refs specified multiple times', () => {
      const res = useThen(
        'invoke review skill with repeated refs flags',
        async () => {
          // clone fixture to temp dir
          const tempDir = genTempDirForRhachet({
            slug: 'review-refs-repeated',
            clone: ASSETS_DIR,
          });
          const outputPath = path.join(tempDir, 'review-refs-repeated.md');

          // link the reviewer role via rhachet
          await execAsync('npx rhachet roles link --role reviewer', {
            cwd: tempDir,
          });

          // invoke skill with multiple --refs flags (array form)
          const cli = await invokeReviewSkill({
            rules: 'rules/rule.verify-refs-included.md',
            paths: 'src/clean.ts',
            refs: [
              'behavior/getWeather/criteria.blackbox.md',
              'behavior/getWeather/criteria.blueprint.md',
            ],
            output: outputPath,
            focus: 'push',
            goal: 'representative',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd: tempDir,
          });

          // log cli output for debug
          console.log('\n--- cli.stdout ---');
          console.log(cli.stdout);
          console.log('\n--- cli.stderr ---');
          console.log(cli.stderr);
          console.log('--- end cli ---\n');

          // read output
          const review = await fs.readFile(outputPath, 'utf-8');

          // log for visibility
          logOutputHead({ label: 'review-refs-repeated.md', output: review });

          return { cli, review };
        },
      );

      then('cli completes successfully', async () => {
        expect(res.cli.stderr).not.toContain('Error');
      });

      then('cli stdout shows refs count = 2 in metrics', async () => {
        // two --refs flags, one file each, so the files tree reads `refs: 2`
        expect(res.cli.stdout).toContain('refs: 2');
      });

      then('the metrics.expected block matches its snapshot (computed before the brain)', () => {
        // the scope tree and estimate are deterministic; the verdict summary is the brain's
        expect(asReviewMetricsExpectedBlock({ stdout: res.cli.stdout })).toMatchSnapshot();
      });

      then('review contains no blockers (all refs accessible)', async () => {
        // check for actual blocker issues (# blocker.N:) not just the word in summary
        expect(res.review.toLowerCase()).not.toMatch(/# blocker\.\d+:/);
        expect(res.review).toContain('0 blockers');
      });
    });
  });
});
