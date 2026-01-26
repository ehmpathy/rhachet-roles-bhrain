import * as fs from 'fs/promises';
import * as path from 'path';

import { genTempDir, given, then, useThen, when } from 'test-fns';

import { logOutputHead } from '@src/.test/logOutputHead';
import { execAsync, invokeReviewSkill } from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

describe('review.acceptance', () => {
  given('[case3] mechanic codebase with dirty code', () => {
    when('[t0] review skill on dirty.ts with goal=exhaustive', () => {
      const res = useThen('invoke review skill with exhaustive goal', async () => {
        // clone fixture to temp dir
        const tempDir = genTempDir({ slug: 'review-exh-dirty', clone: ASSETS_DIR });
        const outputPath = path.join(tempDir, 'review-exhaustive-dirty.md');

        // link the reviewer role via rhachet
        await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });

        // invoke skill with exhaustive goal
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          paths: 'src/dirty.ts',
          output: outputPath,
          mode: 'push',
          goal: 'exhaustive',
          brain: 'xai/grok/code-fast-1',
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
