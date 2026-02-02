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

describe('review.refs-single.acceptance', () => {
  /**
   * usecase.1: pass single ref file to review skill
   * usecase.3: ref content is accessible to rules in review
   */
  given('[case1] single ref file provided to review', () => {
    when('[t0] review skill invoked with --refs set to single file', () => {
      const res = useThen('invoke review skill with single ref', async () => {
        // clone fixture to temp dir
        const tempDir = genTempDirForRhachet({
          slug: 'review-refs-single',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-refs-single.md');

        // link the reviewer role via rhachet
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // invoke skill with single ref
        const cli = await invokeReviewSkill({
          rules: 'rules/rule.verify-refs-included.md',
          paths: 'src/clean.ts',
          refs: 'behavior/getWeather/criteria.blackbox.md',
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
        logOutputHead({ label: 'review-refs-single.md', output: review });

        return { cli, review };
      });

      then('cli completes successfully', async () => {
        expect(res.cli.stderr).not.toContain('Error');
      });

      then('cli stdout shows refs count in metrics', async () => {
        // metrics.expected.files should include refs: 1
        expect(res.cli.stdout).toContain('refs');
      });

      then('review contains no blockers (refs section was accessible)', async () => {
        // the rule.verify-refs-included.md passes when refs are accessible
        // it only raises blocker if refs section is absent when expected
        expect(res.review.toLowerCase()).not.toContain('blocker');
      });
    });
  });
});
