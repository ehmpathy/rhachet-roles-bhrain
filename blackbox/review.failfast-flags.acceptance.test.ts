import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import { sanitizeTimeForSnapshot } from './.test/invokeRouteSkill';
import { execAsync, genTempDirForRhachet } from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

/**
 * .what = invokes the review skill's shell entrypoint with a raw arg string
 * .why = the two rejections here (an unrecognized flag, a bare --paths-with) are not
 *        part of invokeReviewSkill's typed contract — each is a malformed invocation
 *        by construction, so this bypasses the typed helper to compose one directly
 */
const invokeReviewSkillRaw = async (input: {
  args: string;
  cwd: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=reviewer/skills/review.sh',
  );
  const cmd = `bash "${skillPath}" ${input.args}`;
  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: { ...process.env },
    });
    return { ...result, code: 0 };
  } catch (error) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code ?? 1,
    };
  }
};

describe('review.failfast-flags.acceptance', () => {
  /**
   * usecase: an unrecognized flag is passed
   */
  given('[case1] an unrecognized flag is passed', () => {
    when('[t0] review skill invoked with a flag it does not know', () => {
      const res = useThen('invoke review skill with an unknown flag', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-unknown',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths "src/dirty.ts" --bogus-flag`,
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr names the unrecognized flag', async () => {
        expect(res.cli.stderr).toContain('unrecognized flag(s): --bogus-flag');
      });

      then('stderr points to --help', async () => {
        expect(res.cli.stderr).toContain('run with --help for the full flag list');
      });

      // .why = stderr is a caller-visible cli contract surface; snapshot it so a
      //        reword ships visible in the pr diff (rule.require.contract-snapshot-exhaustiveness)
      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * usecase: --paths-with is given with no glob after it
   */
  given('[case2] --paths-with is given with no glob', () => {
    when('[t0] review skill invoked with a bare --paths-with', () => {
      const res = useThen('invoke review skill with a bare --paths-with', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-bare-paths-with',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths-with`,
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr states --paths-with requires a glob', async () => {
        expect(res.cli.stderr).toContain('--paths-with requires a glob pattern');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * usecase: --paths-wout is given with no glob after it
   */
  given('[case3] --paths-wout is given with no glob', () => {
    when('[t0] review skill invoked with a bare --paths-wout', () => {
      const res = useThen('invoke review skill with a bare --paths-wout', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-bare-paths-wout',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths-with "src/**/*.ts" --paths-wout`,
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr states --paths-wout requires a glob', async () => {
        expect(res.cli.stderr).toContain('--paths-wout requires a glob pattern');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });
});
