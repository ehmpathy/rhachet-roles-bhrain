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

const STALE_BRAIN = 'fireworks/deepseek/v4-flash';

const REFUSAL_HINT = `the run never reached the brain-choice refusal — check that '${STALE_BRAIN}' is still absent from the installed brain packages, then read the captured stdout/stderr`;

/**
 * .what = invokes the review skill with a stale fireworks brain slug
 * .why = the child env drops OPENROUTER_API_KEY and points HOME at an empty dir, so no key can
 *        be read and none can leak into the output. a refusal that still names the slug proves
 *        the slug is refused at brain choice, before any key read or vendor call
 */
const invokeReviewWithStaleBrain = async (input: {
  cwd: string;
  home: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=reviewer/skills/review.sh',
  );

  const cmd = [
    `bash "${skillPath}"`,
    `--rules 'rules/rule.require.what-why-headers.md'`,
    `--paths 'src/dirty.ts'`,
    `--output '/dev/null'`,
    `--focus push`,
    `--goal representative`,
    `--brain '${STALE_BRAIN}'`,
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
 * .what = acceptance clamp on `rhx review --brain fireworks/...` after fireworks was removed
 * .why = vision forbidden cell F-1: a stale fireworks slug must be refused at brain choice, with
 *        the valid choices listed, and never sent to a vendor. the rendered refusal is pinned so a
 *        change to it shows in the diff (rule.require.contract-snapshot-exhaustiveness)
 */
describe('review.brain-stale.acceptance', () => {
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'review-brain-stale',
      clone: ASSETS_DIR,
    });
    await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });

    // an empty home: no host keyrack, so no key is in reach
    const home = path.join(tempDir, '.home-empty');
    await fs.mkdir(home, { recursive: true });

    return { tempDir, home };
  });

  given('[case1] a guard or human names the removed fireworks brain', () => {
    when(`[t0] rhx review runs with --brain ${STALE_BRAIN}`, () => {
      const result = useThen('review refuses', async () =>
        invokeReviewWithStaleBrain({ cwd: scene.tempDir, home: scene.home }),
      );

      then('CLAMP: exit 2 — a constraint the caller fixes, never a malfunction', () => {
        // .why = a stale slug is caller-fixable. a bare `not.toEqual(0)` would also pass for
        //        exit 1, the code an uncaught crash returns
        expect(result.code).toEqual(2);
      });

      then('CLAMP: the refusal names the stale slug', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain(STALE_BRAIN);
      });

      then('CLAMP: the refusal lists the valid choice', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('openrouter/deepseek/flash');
      });

      then('CLAMP: the refusal renders without a stack trace', () => {
        const output = result.stdout + result.stderr;
        expect(output).not.toMatch(/^\s+at .+\(.+:\d+:\d+\)$/m);
      });

      then('the rendered refusal is pinned', () => {
        const output = sanitizeTimeForSnapshot(result.stdout + result.stderr);
        expect(asRefusalBlock({ output, hint: REFUSAL_HINT })).toMatchSnapshot();
      });
    });
  });
});
