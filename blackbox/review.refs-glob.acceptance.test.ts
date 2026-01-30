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

describe('review.refs-glob.acceptance', () => {
  /**
   * usecase.2: pass multiple refs via glob pattern
   */
  given('[case1] glob pattern matches multiple ref files', () => {
    when('[t0] review skill invoked with --refs set to glob pattern', () => {
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
          mode: 'push',
          goal: 'representative',
          brain: 'xai/grok/code-fast-1',
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

      then('cli stdout shows refs count >= 2 in metrics', async () => {
        // metrics.expected.files should include refs: 2 (both criteria files)
        expect(res.cli.stdout).toContain('refs');
      });

      then('review contains no blockers (all refs accessible)', async () => {
        expect(res.review.toLowerCase()).not.toContain('blocker');
      });
    });
  });

  /**
   * usecase.7: multiple --refs via repeated flags
   */
  given('[case2] multiple refs via repeated --refs flags', () => {
    when('[t0] review skill invoked with --refs specified multiple times', () => {
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
            mode: 'push',
            goal: 'representative',
            brain: 'xai/grok/code-fast-1',
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
        // metrics.expected.files should include refs: 2
        expect(res.cli.stdout).toContain('refs');
      });

      then('review contains no blockers (all refs accessible)', async () => {
        expect(res.review.toLowerCase()).not.toContain('blocker');
      });
    });
  });
});
