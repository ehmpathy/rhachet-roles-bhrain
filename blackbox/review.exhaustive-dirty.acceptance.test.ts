import * as fs from 'fs/promises';
import * as path from 'path';

import { genTempDir, given, then, useThen, when } from 'test-fns';

import { logOutputHead } from '@src/.test/logOutputHead';
import { invokeReviewSkill } from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');
const REPO_ROOT = path.resolve(__dirname, '..');

describe('review.acceptance', () => {
  given('[case3] mechanic codebase with dirty code', () => {
    when('[t0] review skill on dirty.ts with goal=exhaustive', () => {
      const res = useThen('invoke review skill with exhaustive goal', async () => {
        // clone fixture to temp dir
        const tempDir = genTempDir({ slug: 'review-exh-dirty', clone: ASSETS_DIR });
        const outputPath = path.join(tempDir, 'review-exhaustive-dirty.md');

        // create .agent/ symlinks directly to repo's dist/
        // note: we can't use `rhachet roles link` because on CI the `file:.`
        // self-reference in package.json copies files at install time before
        // `dist/` exists, so the node_modules copy is empty
        const agentRolePath = path.join(
          tempDir,
          '.agent/repo=bhrain/role=reviewer',
        );
        await fs.mkdir(agentRolePath, { recursive: true });
        await fs.symlink(
          path.join(REPO_ROOT, 'dist/domain.roles/reviewer/skills'),
          path.join(agentRolePath, 'skills'),
        );

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
