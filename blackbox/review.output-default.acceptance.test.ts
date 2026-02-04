import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

describe('review.output-default.acceptance', () => {
  given('[case1] mechanic codebase with review skill', () => {
    when('[t0] review skill invoked without --output flag', () => {
      const res = useThen('invoke review skill without --output', async () => {
        // clone fixture to temp dir with git initialized
        const tempDir = genTempDirForRhachet({
          slug: 'review-output-default',
          clone: ASSETS_DIR,
        });

        // link the reviewer role via rhachet
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // invoke skill without --output
        const cli = await invokeReviewSkill({
          rules: 'rules/*.md',
          paths: 'src/clean.ts',
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

        // find the generated output file in .review/
        const reviewDir = path.join(tempDir, '.review');
        let outputPath: string | null = null;

        try {
          // list branch directories
          const branchDirs = await fs.readdir(reviewDir);
          if (branchDirs.length > 0) {
            const branchDir = path.join(reviewDir, branchDirs[0]!);
            const files = await fs.readdir(branchDir);
            const outputFile = files.find((f) => f.endsWith('.output.md'));
            if (outputFile) {
              outputPath = path.join(branchDir, outputFile);
            }
          }
        } catch {
          // .review dir may not exist if test failed early
        }

        return { cli, tempDir, outputPath };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout contains the output path', () => {
        expect(res.cli.stdout).toContain('output:');
        expect(res.cli.stdout).toContain('.review/');
      });

      then('.review/ directory is created', async () => {
        const reviewDir = path.join(res.tempDir, '.review');
        const stat = await fs.stat(reviewDir);
        expect(stat.isDirectory()).toBe(true);
      });

      then('output file exists at default path', () => {
        expect(res.outputPath).not.toBeNull();
      });

      then('output file contains review content', async () => {
        if (!res.outputPath) throw new Error('outputPath is null');
        const content = await fs.readFile(res.outputPath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      });
    });
  });
});
