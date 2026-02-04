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

describe('review.output-mkdir.acceptance', () => {
  given('[case1] mechanic codebase with review skill', () => {
    when('[t0] review skill invoked with --output to absent parent dir', () => {
      const res = useThen(
        'invoke review skill with --output to absent parent',
        async () => {
          // clone fixture to temp dir with git initialized
          const tempDir = genTempDirForRhachet({
            slug: 'review-output-mkdir',
            clone: ASSETS_DIR,
          });

          // define output path with absent parent directory
          const outputPath = path.join(
            tempDir,
            'nested/deep/path/review-output.md',
          );

          // verify parent does not exist
          const parentDir = path.dirname(outputPath);
          let parentExistsBefore = false;
          try {
            await fs.access(parentDir);
            parentExistsBefore = true;
          } catch {
            parentExistsBefore = false;
          }

          // link the reviewer role via rhachet
          await execAsync('npx rhachet roles link --role reviewer', {
            cwd: tempDir,
          });

          // invoke skill with --output to absent parent
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

          // check if output file was created
          let outputFileCreated = false;
          let reviewContent = '';
          try {
            reviewContent = await fs.readFile(outputPath, 'utf-8');
            outputFileCreated = true;
            logOutputHead({
              label: 'review-output-mkdir.md',
              output: reviewContent,
            });
          } catch {
            outputFileCreated = false;
          }

          return {
            cli,
            tempDir,
            outputPath,
            parentDir,
            parentExistsBefore,
            outputFileCreated,
            reviewContent,
          };
        },
      );

      then('parent directory did not exist before', () => {
        expect(res.parentExistsBefore).toBe(false);
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('parent directory is created', async () => {
        const stat = await fs.stat(res.parentDir);
        expect(stat.isDirectory()).toBe(true);
      });

      then('output file is created at specified path', () => {
        expect(res.outputFileCreated).toBe(true);
      });

      then('output file contains review content', () => {
        expect(res.reviewContent.length).toBeGreaterThan(0);
      });
    });
  });
});
