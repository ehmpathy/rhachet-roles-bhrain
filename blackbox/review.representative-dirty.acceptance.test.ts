import * as fs from 'fs/promises';
import * as path from 'path';

import { genTempDir, given, then, useThen, when } from 'test-fns';

import { logOutputHead } from '@src/.test/logOutputHead';
import { invokeReviewSkill } from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');
const REPO_ROOT = path.resolve(__dirname, '..');

describe('review.acceptance', () => {
  given('[case2] mechanic codebase with dirty code', () => {
    when('[t0] review skill on dirty.ts with goal=representative', () => {
      const res = useThen('invoke review skill on dirty code', async () => {
        // clone fixture to temp dir
        const tempDir = genTempDir({ slug: 'review-rep-dirty', clone: ASSETS_DIR });
        const outputPath = path.join(tempDir, 'review-representative-dirty.md');

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

        // invoke skill
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          paths: 'src/dirty.ts',
          output: outputPath,
          mode: 'push',
          goal: 'representative',
          brain: 'xai/grok/code-fast-1',
          cwd: tempDir,
        });

        // read output
        const review = await fs.readFile(outputPath, 'utf-8');

        // log for visibility
        logOutputHead({ label: 'review-representative-dirty.md', output: review });

        return { cli, review };
      });

      then('cli completes successfully', async () => {
        expect(res.cli.stderr).not.toContain('Error');
      });

      then('review is defined and non-empty', async () => {
        expect(res.review).toBeDefined();
        expect(res.review.length).toBeGreaterThan(0);
      });

      then('review detects function keyword violation', async () => {
        const reviewLower = res.review.toLowerCase();
        expect(reviewLower).toContain('blocker');
        // should mention function keyword or arrow-only rule
        expect(
          reviewLower.includes('function') ||
            reviewLower.includes('arrow') ||
            reviewLower.includes('keyword'),
        ).toBe(true);
      });

      then('review detects absent .what/.why headers', async () => {
        const reviewLower = res.review.toLowerCase();
        // should mention headers, comments, or what/why
        expect(
          reviewLower.includes('.what') ||
            reviewLower.includes('.why') ||
            reviewLower.includes('header') ||
            reviewLower.includes('comment'),
        ).toBe(true);
      });

      then('review includes locations', async () => {
        // should have file:line format locations
        expect(res.review).toMatch(/dirty\.ts:\d+/);
      });
    });
  });
});
