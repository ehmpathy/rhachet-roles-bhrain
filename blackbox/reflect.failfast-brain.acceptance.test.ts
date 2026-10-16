import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import { asExecResultOrThrow } from './.test/asExecResultOrThrow';
import { sanitizeTimeForSnapshot } from './.test/invokeRouteSkill';
import { execAsync, genTempDirForRhachet } from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

/**
 * .what = invokes the reflect skill's shell entrypoint with a raw arg string
 * .why = a bad `--brain` is a malformed invocation by construction, so this composes
 *        one directly, the same way `review.failfast-flags` composes its own
 */
const invokeReflectSkillRaw = async (input: {
  args: string;
  cwd: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=reviewer/skills/reflect.sh',
  );
  const cmd = `bash "${skillPath}" ${input.args}`;
  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: { ...process.env },
    });
    return { ...result, code: 0 };
  } catch (error) {
    // a nonzero exit is a skill result; any other fault rethrows (rule.forbid.failhide)
    return asExecResultOrThrow({ error });
  }
};

describe('reflect.failfast-brain.acceptance', () => {
  /**
   * usecase: a brain slug that no package registers
   * .why = reflect builds its brain inside its try, so this refusal must reach the human
   *        as a `✋ ConstraintError:` header and exit 2, never a raw `BadRequestError:`
   *        with a stack. review's own surface is pinned in `review.failfast-flags`;
   *        this pins reflect's
   */
  given('[case1] --brain names a slug no package registers', () => {
    when('[t0] reflect skill invoked with that brain', () => {
      const res = useThen('invoke reflect skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'reflect-failfast-brain-unregistered',
          clone: ASSETS_DIR,
        });
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });
        const cli = await invokeReflectSkillRaw({
          args: '--source . --target ./rules --brain nowhere/glm/flash/v0',
          cwd: tempDir,
        });
        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      // the refusal wears reflect's own `🌕` frame, as every other reflect refusal does
      then('stderr opens on the reflect frame, under the constraint header', async () => {
        expect(res.cli.stderr).toContain(
          "🌕 reflect\n   ├─ ✋ ConstraintError: brain 'nowhere/glm/flash/v0' is not registered",
        );
      });

      // the hint rides as its own fix row; the raw metadata json never reaches the human
      then('stderr names the fix, never the raw metadata', async () => {
        expect(res.cli.stderr).toContain('   └─ fix: a brain registers only');
        expect(res.cli.stderr).not.toContain('"hint":');
      });

      then('stderr carries no raw stack', async () => {
        expect(res.cli.stderr).not.toContain('    at ');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });
});
