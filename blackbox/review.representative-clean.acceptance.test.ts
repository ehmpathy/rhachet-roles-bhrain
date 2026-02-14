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

describe('review.acceptance', () => {
  given('[case1] mechanic codebase with clean code', () => {
    when('[t0] review skill on clean.ts with goal=representative', () => {
      const res = useThen('invoke review skill on clean code', async () => {
        // clone fixture to temp dir with git initialized
        const tempDir = genTempDirForRhachet({ slug: 'review-rep-clean', clone: ASSETS_DIR });
        const outputPath = path.join(tempDir, 'review-representative-clean.md');

        // link the reviewer role via rhachet
        await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });

        // invoke skill
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          paths: 'src/clean.ts',
          output: outputPath,
          focus: 'push',
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
        logOutputHead({ label: 'review-representative-clean.md', output: review });

        return { cli, review };
      });

      then('cli completes successfully', async () => {
        expect(res.cli.stderr).not.toContain('Error');
      });

      then('review contains no blockers', async () => {
        // nitpicks are acceptable; only blockers are not
        // check for actual blocker issues (# blocker.N:) not just the word in summary
        expect(res.review.toLowerCase()).not.toMatch(/# blocker\.\d+:/);
        expect(res.review).toContain('0 blockers');
      });
    });
  });
});
