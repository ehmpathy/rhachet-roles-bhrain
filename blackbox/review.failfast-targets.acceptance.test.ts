import * as path from 'path';

import { genTempDir, given, then, useThen, when } from 'test-fns';

import { execAsync, invokeReviewSkill } from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

describe('review.failfast-targets.acceptance', () => {
  /**
   * usecase: paths glob matches zero files
   */
  given('[case1] paths glob matches no files', () => {
    when('[t0] review skill invoked with paths glob that resolves to zero', () => {
      const res = useThen(
        'invoke review skill with empty paths glob',
        async () => {
          // clone fixture to temp dir
          const tempDir = genTempDir({
            slug: 'review-failfast-targets-glob',
            clone: ASSETS_DIR,
          });
          const outputPath = path.join(tempDir, 'review-failfast.md');

          // link the reviewer role via rhachet
          await execAsync('npx rhachet roles link --role reviewer', {
            cwd: tempDir,
          });

          // invoke skill with glob that matches no files
          const cli = await invokeReviewSkill({
            rules: 'rules/rule.require.arrow-only.md',
            paths: 'src/nonexistent/*.ts',
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

          return { cli };
        },
      );

      then('cli exits with non-zero code', async () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error message indicates scope resolves to zero files', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output.toLowerCase()).toContain('zero');
      });
    });
  });

  /**
   * usecase: explicit target path does not exist
   */
  given('[case2] explicit target path does not exist', () => {
    when('[t0] review skill invoked with non-existent target path', () => {
      const res = useThen(
        'invoke review skill with invalid target path',
        async () => {
          // clone fixture to temp dir
          const tempDir = genTempDir({
            slug: 'review-failfast-targets-path',
            clone: ASSETS_DIR,
          });
          const outputPath = path.join(tempDir, 'review-failfast.md');

          // link the reviewer role via rhachet
          await execAsync('npx rhachet roles link --role reviewer', {
            cwd: tempDir,
          });

          // invoke skill with path that doesn't exist
          const cli = await invokeReviewSkill({
            rules: 'rules/rule.require.arrow-only.md',
            paths: 'src/DOES_NOT_EXIST.ts',
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

          return { cli };
        },
      );

      then('cli exits with non-zero code', async () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error message indicates scope resolves to zero files', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output.toLowerCase()).toContain('zero');
      });
    });
  });
});
