import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

describe('review.refs-error.acceptance', () => {
  /**
   * usecase.5: invalid ref path
   */
  given('[case1] ref path does not exist', () => {
    when('[t0] review skill invoked with non-existent ref path', () => {
      const res = useThen(
        'invoke review skill with invalid ref path',
        async () => {
          // clone fixture to temp dir
          const tempDir = genTempDirForRhachet({
            slug: 'review-refs-error-path',
            clone: ASSETS_DIR,
          });
          const outputPath = path.join(tempDir, 'review-refs-error.md');

          // link the reviewer role via rhachet
          await execAsync('npx rhachet roles link --role reviewer', {
            cwd: tempDir,
          });

          // invoke skill with non-existent ref path
          const cli = await invokeReviewSkill({
            rules: 'rules/rule.verify-refs-included.md',
            paths: 'src/clean.ts',
            refs: 'behavior/getWeather/criteria.blackbox.DOES_NOT_EXIST.md',
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

      then('cli fails with clear error message', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        // should contain error about ref not found
        expect(output.toLowerCase()).toContain('ref not found');
      });

      then('error message includes the invalid path', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output).toContain('DOES_NOT_EXIST');
      });
    });
  });

  /**
   * usecase.6: glob matches zero files
   */
  given('[case2] glob pattern matches no files', () => {
    when('[t0] review skill invoked with glob that resolves to zero matches', () => {
      const res = useThen(
        'invoke review skill with empty glob result',
        async () => {
          // clone fixture to temp dir
          const tempDir = genTempDirForRhachet({
            slug: 'review-refs-error-glob',
            clone: ASSETS_DIR,
          });
          const outputPath = path.join(tempDir, 'review-refs-error-glob.md');

          // link the reviewer role via rhachet
          await execAsync('npx rhachet roles link --role reviewer', {
            cwd: tempDir,
          });

          // invoke skill with glob that resolves to zero files
          const cli = await invokeReviewSkill({
            rules: 'rules/rule.verify-refs-included.md',
            paths: 'src/clean.ts',
            refs: 'behavior/nonexistent/*.md',
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

      then('cli fails with clear error message', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        // should contain error about no refs matched
        expect(output.toLowerCase()).toContain('no refs matched');
      });

      then('error message includes the glob pattern', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output).toContain('nonexistent');
      });
    });
  });
});
