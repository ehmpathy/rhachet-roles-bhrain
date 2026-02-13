import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

describe('review.failfast-rules.acceptance', () => {
  /**
   * usecase: rules glob matches zero files
   */
  given('[case1] rules glob matches no files', () => {
    when('[t0] review skill invoked with rules glob that resolves to zero', () => {
      const res = useThen(
        'invoke review skill with empty rules glob',
        async () => {
          // clone fixture to temp dir
          const tempDir = genTempDirForRhachet({
            slug: 'review-failfast-rules-glob',
            clone: ASSETS_DIR,
          });
          const outputPath = path.join(tempDir, 'review-failfast.md');

          // link the reviewer role via rhachet
          await execAsync('npx rhachet roles link --role reviewer', {
            cwd: tempDir,
          });

          // invoke skill with glob that matches no files
          const cli = await invokeReviewSkill({
            rules: 'rules/nonexistent/*.md',
            paths: 'src/dirty.ts',
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

          return { cli };
        },
      );

      then('cli exits with non-zero code', async () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error message indicates rules glob was ineffective', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output.toLowerCase()).toContain('rules');
        expect(output.toLowerCase()).toContain('nada');
      });
    });
  });

  /**
   * usecase: explicit rules path does not exist
   */
  given('[case2] explicit rules path does not exist', () => {
    when('[t0] review skill invoked with non-existent rules path', () => {
      const res = useThen(
        'invoke review skill with invalid rules path',
        async () => {
          // clone fixture to temp dir
          const tempDir = genTempDirForRhachet({
            slug: 'review-failfast-rules-path',
            clone: ASSETS_DIR,
          });
          const outputPath = path.join(tempDir, 'review-failfast.md');

          // link the reviewer role via rhachet
          await execAsync('npx rhachet roles link --role reviewer', {
            cwd: tempDir,
          });

          // invoke skill with path that doesn't exist
          const cli = await invokeReviewSkill({
            rules: 'rules/DOES_NOT_EXIST.md',
            paths: 'src/dirty.ts',
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

          return { cli };
        },
      );

      then('cli exits with non-zero code', async () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error message indicates rules matched zero files', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output.toLowerCase()).toContain('rules');
        expect(output.toLowerCase()).toContain('nada');
      });
    });
  });
});
