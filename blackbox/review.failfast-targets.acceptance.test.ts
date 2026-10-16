import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';
import { asRedactedOutput } from './.test/asRedactedOutput';
import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';

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
          const tempDir = genTempDirForRhachet({
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
            focus: 'push',
            goal: 'representative',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
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

      then('cli exits 2, a constraint the caller must fix', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('the refusal renders whole', async () => {
        expect(asRedactedOutput(res.cli.stderr)).toMatchSnapshot();
      });

      then('error message indicates scope resolves to zero files', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output.toLowerCase()).toContain('zero');
      });

      then(
        '🔴 the refusal names its class once, never a second bare header beneath the frame',
        async () => {
          const headers = res.cli.stderr.match(/✋ ConstraintError:/g) ?? [];
          expect(headers).toHaveLength(1);
        },
      );
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
          const tempDir = genTempDirForRhachet({
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
            focus: 'push',
            goal: 'representative',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
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

      then('cli exits 2, a constraint the caller must fix', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('the refusal renders whole', async () => {
        expect(asRedactedOutput(res.cli.stderr)).toMatchSnapshot();
      });

      then('error message indicates scope resolves to zero files', async () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output.toLowerCase()).toContain('zero');
      });

      then(
        '🔴 the refusal names its class once, never a second bare header beneath the frame',
        async () => {
          const headers = res.cli.stderr.match(/✋ ConstraintError:/g) ?? [];
          expect(headers).toHaveLength(1);
        },
      );
    });
  });
});
