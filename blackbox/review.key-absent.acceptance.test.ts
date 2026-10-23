import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  asChildEnv,
  asRefusalBlock,
  execAsync,
  genTempDirForRhachet,
  invokeShellCommand,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

const REFUSAL_HINT =
  'the run never reached the keyrack refusal — check that the child env lacks OPENROUTER_API_KEY and HOME holds no keyrack, then read the captured stdout/stderr';

/**
 * .what = invokes the review skill on its default brain with the openrouter key out of reach
 * .why = `invokeReviewSkill` inherits `process.env` with no override slot. this helper removes
 *        `OPENROUTER_API_KEY` from the child env and points HOME at an empty dir, so neither the
 *        env nor the ehmpath keyrack can supply the key — the state of a machine where the key
 *        was never filled
 */
const invokeReviewWithKeyAbsent = async (input: {
  cwd: string;
  home: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=reviewer/skills/review.sh',
  );

  // no --brain: the default brain is the path under test
  const cmd = [
    `bash "${skillPath}"`,
    `--rules 'rules/rule.require.what-why-headers.md'`,
    `--paths 'src/dirty.ts'`,
    `--output '/dev/null'`,
    `--focus push`,
    `--goal representative`,
  ].join(' ');

  // the child env comes from the shared `asChildEnv`; `undefined` deletes the key
  return invokeShellCommand({
    cmd,
    cwd: input.cwd,
    env: asChildEnv({
      overrides: { OPENROUTER_API_KEY: undefined, HOME: input.home },
    }),
  });
};

/**
 * .what = acceptance clamp on `rhx review` when the openrouter key is absent locally
 * .why = vision case 3 (`key-absent-locally`, a critipath): a human who has not filled
 *        OPENROUTER_API_KEY runs `rhx review`. the run must fail fast and loud, never hang or
 *        exit 0, and the rendered refusal is pinned so a change to it shows in the diff
 *        (rule.require.contract-snapshot-exhaustiveness)
 */
describe('review.key-absent.acceptance', () => {
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'review-key-absent',
      clone: ASSETS_DIR,
    });
    await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });

    // an empty home: no host keyrack, so the key cannot be found
    const home = path.join(tempDir, '.home-empty');
    await fs.mkdir(home, { recursive: true });

    return { tempDir, home };
  });

  given('[case1] OPENROUTER_API_KEY is absent from env and keyrack', () => {
    when('[t0] rhx review runs on its default brain', () => {
      const result = useThen('review refuses', async () =>
        invokeReviewWithKeyAbsent({ cwd: scene.tempDir, home: scene.home }),
      );

      then('CLAMP: exit 2 — a constraint the caller fixes, never a malfunction', () => {
        // .why = an absent key is caller-fixable. a bare `not.toEqual(0)` would also pass
        //        for exit 1, the code an uncaught crash returns
        expect(result.code).toEqual(2);
      });

      then('CLAMP: the refusal names the key and the command that fills it', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('OPENROUTER_API_KEY');
        expect(output).toContain(
          'rhx keyrack set --owner ehmpath --key OPENROUTER_API_KEY --env prep',
        );
      });

      then('CLAMP: the refusal renders without a stack trace', () => {
        // .why = the refusal comes from rhachet's own helpful-errors copy; before the fix,
        //        `instanceof` missed it and node printed the stack under the tip
        const output = result.stdout + result.stderr;
        expect(output).not.toMatch(/^\s+at .+\(.+:\d+:\d+\)$/m);
        expect(output).not.toContain('node_modules');
      });

      then('the rendered refusal is pinned', () => {
        // .why = only the refusal is pinned. the preamble above it carries a spinner frame and
        //        an elapsed counter, which vary with host speed, and is pinned by other suites
        const output = sanitizeTimeForSnapshot(result.stdout + result.stderr);
        expect(asRefusalBlock({ output, hint: REFUSAL_HINT })).toMatchSnapshot();
      });
    });
  });
});
