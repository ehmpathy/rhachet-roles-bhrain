import { execSync } from 'child_process';
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
 * .what = git identity env for commits
 * .why = avoids need for global git config on cicd machines
 */
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test User',
  GIT_AUTHOR_EMAIL: 'test@test.com',
  GIT_COMMITTER_NAME: 'Test User',
  GIT_COMMITTER_EMAIL: 'test@test.com',
};

describe('review.acceptance', () => {
  given('[case1] user specifies only --rules (default case)', () => {
    when('[t0] review skill invoked with only --rules dirpath', () => {
      const res = useThen('invoke review skill with rules only', async () => {
        // clone fixture to temp dir with git initialized
        const tempDir = genTempDirForRhachet({
          slug: 'review-rules-only',
          clone: ASSETS_DIR,
        });

        // link the reviewer role via rhachet
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // create an uncommitted change for since-main to pick up
        // (when --paths is omitted, diffs defaults to since-main)
        await fs.writeFile(
          path.join(tempDir, 'src/newchange.ts'),
          'export const x: any = 1; // should be reviewed',
          'utf-8',
        );
        execSync('git add .', { cwd: tempDir, stdio: 'pipe', env: GIT_ENV });

        // invoke skill with only --rules (all other options default)
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          cwd: tempDir,
        });

        // log cli output for debug
        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        // find the generated output file (should be in .review/)
        const reviewDir = path.join(tempDir, '.review');
        const reviewDirExists = await fs
          .stat(reviewDir)
          .then(() => true)
          .catch(() => false);

        let reviewContent = '';
        let outputPath = '';
        if (reviewDirExists) {
          // find the output file (nested under branch dir)
          const branchDirs = await fs.readdir(reviewDir);
          if (branchDirs.length > 0) {
            const branchDir = path.join(reviewDir, branchDirs[0]!);
            const outputFiles = await fs.readdir(branchDir);
            const outputFile = outputFiles.find((f) => f.endsWith('.output.md'));
            if (outputFile) {
              outputPath = path.join(branchDir, outputFile);
              reviewContent = await fs.readFile(outputPath, 'utf-8');
            }
          }
        }

        // log for visibility
        if (reviewContent) {
          logOutputHead({ label: 'review-rules-only.md', output: reviewContent });
        }

        return { cli, reviewContent, outputPath, tempDir };
      });

      then('cli completes successfully', async () => {
        expect(res.cli.code).toBe(0);
        expect(res.cli.stderr).not.toContain('Error');
      });

      then('output is written to .review/$branch/*.output.md', async () => {
        expect(res.outputPath).toContain('.review/');
        expect(res.outputPath).toContain('.output.md');
      });

      then('review content is non-empty', async () => {
        expect(res.reviewContent.length).toBeGreaterThan(0);
      });

      then('stdout shows header with brain, focus, output', async () => {
        expect(res.cli.stdout).toContain("🦉 let's review");
        expect(res.cli.stdout).toContain('brain:');
        expect(res.cli.stdout).toContain('focus:');
        expect(res.cli.stdout).toContain('output:');
      });

      then('stdout shows metrics section', async () => {
        expect(res.cli.stdout).toContain('🔭 metrics.expected');
        expect(res.cli.stdout).toContain('rules:');
        expect(res.cli.stdout).toContain('targets:');
      });

      then('stdout shows owl verdict', async () => {
        // should have one of the three owl pun headers
        const hasOwlVerdict =
          res.cli.stdout.includes('🦉 needs your talons') ||
          res.cli.stdout.includes('🦉 just a few hoots') ||
          res.cli.stdout.includes('🦉 not even a vole');
        expect(hasOwlVerdict).toBe(true);
      });
    });
  });

  given('[case2] user excludes .behavior via negation pattern', () => {
    when('[t0] review with --diffs since-main --paths !.behavior/**', () => {
      const res = useThen('invoke review with exclusion pattern', async () => {
        // clone fixture to temp dir with git initialized
        const tempDir = genTempDirForRhachet({
          slug: 'review-exclude-behavior',
          clone: ASSETS_DIR,
        });

        // link the reviewer role via rhachet
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // create a .behavior file and a src file as uncommitted changes
        await fs.mkdir(path.join(tempDir, '.behavior'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.behavior/test.md'),
          '# behavior file\nthis should be excluded',
          'utf-8',
        );
        await fs.writeFile(
          path.join(tempDir, 'src/newfile.ts'),
          'export const x: any = 1; // should be included and flagged',
          'utf-8',
        );

        // stage the changes
        execSync('git add .', { cwd: tempDir, stdio: 'pipe' });

        // invoke skill with diffs and exclusion pattern
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          diffs: 'since-staged',
          paths: '!.behavior/**',
          cwd: tempDir,
        });

        // log cli output for debug
        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        // find the generated output file
        const reviewDir = path.join(tempDir, '.review');
        const reviewDirExists = await fs
          .stat(reviewDir)
          .then(() => true)
          .catch(() => false);

        let reviewContent = '';
        let outputPath = '';
        if (reviewDirExists) {
          const branchDirs = await fs.readdir(reviewDir);
          if (branchDirs.length > 0) {
            const branchDir = path.join(reviewDir, branchDirs[0]!);
            const outputFiles = await fs.readdir(branchDir);
            const outputFile = outputFiles.find((f) => f.endsWith('.output.md'));
            if (outputFile) {
              outputPath = path.join(branchDir, outputFile);
              reviewContent = await fs.readFile(outputPath, 'utf-8');
            }
          }
        }

        if (reviewContent) {
          logOutputHead({
            label: 'review-exclude-behavior.md',
            output: reviewContent,
          });
        }

        return { cli, reviewContent, outputPath, tempDir };
      });

      then('cli completes successfully', async () => {
        expect(res.cli.code).toBe(0);
      });

      then('review does not mention .behavior files', async () => {
        expect(res.reviewContent).not.toContain('.behavior');
        expect(res.reviewContent).not.toContain('behavior file');
      });

      then('review does mention src/newfile.ts', async () => {
        // the newfile.ts should be in scope since it's in diffs and not excluded
        expect(res.cli.stdout).toContain('targets:');
      });
    });
  });
});
