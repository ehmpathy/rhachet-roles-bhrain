import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';
import { pathToFileURL } from 'url';

/**
 * .what = acceptance tests for a `--brain` the cli cannot boot
 * .why = `genReviewBrain` converts an unregistered brain into a `BadRequestError` with a
 *        fix. only a spawned cli shows what a driver reads: the exit code, the stderr
 *        header, and that the fix survives the render.
 *
 * .how = imports by absolute path (rule.require.blackbox-via-selflink), so the spawn
 *        cwd is free to be a fixture root rather than this repo.
 */
const CLI_MODULE_URL = pathToFileURL(
  require.resolve('rhachet-roles-bhrain/cli/review'),
).href;
const CLI_COMMAND = `import(${JSON.stringify(
  CLI_MODULE_URL,
)}).then(m => m.review())`;

const runCli = (input: {
  cwd: string;
  args: string[];
  env?: Record<string, string>;
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('node', ['-e', CLI_COMMAND, '--', ...input.args], {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    // stripped, so a refusal cannot accidentally pass by reaching a provider
    env: {
      ...process.env,
      ANTHROPIC_API_KEY: '',
      OPENAI_API_KEY: '',
      OPENROUTER_API_KEY: '',
      ...input.env,
    },
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
};

describe('reviewBrainRefusal.acceptance', () => {
  given('[case1] the default brain, with its provider key locked', () => {
    const ran = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'review-brain-locked' });
      fs.writeFileSync(path.join(cwd, 'rules.md'), '# rules\n\nbe kind.\n');
      fs.writeFileSync(path.join(cwd, 'a.ts'), 'export const a = 1;\n');
      return runCli({
        cwd,
        // no `--brain`: the default is what a first run reaches for
        args: [
          '--rules',
          'rules.md',
          '--paths-with',
          'a.ts',
          '--output',
          'review.md',
        ],
        env: { OPENROUTER_API_KEY: '' },
      });
    });

    when('[t0] the driver runs it', () => {
      then('it refuses as a constraint, exit 2', () => {
        expect(ran.exitCode).toEqual(2);
      });

      then('stderr names the brain and the keyrack fix, not a stack', () => {
        expect(ran.stderr).toContain('✋ ConstraintError:');
        expect(ran.stderr).toContain('is not registered');
        expect(ran.stderr).toContain(
          'rhx keyrack unlock --owner ehmpath --env prep',
        );
        expect(ran.stderr).not.toContain('    at ');
      });

      then('it spent naught — no review ran', () => {
        expect(ran.stdout).not.toContain('blockers');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });
});
