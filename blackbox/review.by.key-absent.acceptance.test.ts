import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  DEMO_ROLE,
  genReviewByFixture,
} from './.test/invokeReviewBySkill';
import {
  asChildEnv,
  invokeShellCommand,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-review-by');

const FRAME_HINT =
  'the run never reached the rubric frame — check that the child env lacks OPENROUTER_API_KEY and HOME holds no keyrack, then read the captured stdout/stderr';

/**
 * .what = the rubric frame of a review.by output, from its header to the end
 * .why = the preamble above the frame carries a spinner frame and an elapsed counter, which
 *        vary with host speed. fails loud where no frame header renders, so a run that never
 *        reached the refusal cannot pass
 */
const asFrameBlock = (input: { output: string; hint: string }): string => {
  // the frame header today is `💥 rubric malfunctioned`; once F5 lands it is `✋`
  const starts = ['💥 rubric malfunctioned', '✋']
    .map((header) => input.output.indexOf(header))
    .filter((index) => index !== -1);
  if (!starts.length)
    throw new Error(`no rubric frame header in output. hint: ${input.hint}`);
  return input.output.slice(Math.min(...starts));
};

const KEY_SET_COMMAND =
  'rhx keyrack set --owner ehmpath --key OPENROUTER_API_KEY --env prep';

/**
 * .what = invokes review.by on its default brain with the openrouter key out of reach
 * .why = `invokeReviewBySkill` inherits `process.env` with no override slot. this removes
 *        `OPENROUTER_API_KEY` from the child env and points HOME at an empty dir, so neither the
 *        env nor the ehmpath keyrack can supply the key
 */
const invokeReviewByWithKeyAbsent = async (input: {
  cwd: string;
  home: string;
  for: string | null;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=reviewer/skills/review.by.sh',
  );

  // no --brain: the default brain is the path under test
  const cmd = [
    `bash "${skillPath}"`,
    `--role "${DEMO_ROLE}"`,
    input.for ? `--for "${input.for}"` : '',
    `--paths 'src/dirty.ts'`,
  ]
    .filter(Boolean)
    .join(' ');

  return invokeShellCommand({
    cmd,
    cwd: input.cwd,
    env: asChildEnv({
      overrides: { OPENROUTER_API_KEY: undefined, HOME: input.home },
    }),
  });
};

/**
 * .what = acceptance clamp on `review.by` when the openrouter key is absent locally
 * .why = vision case 1 names `review.by --for <rubric>` as the path a guard drives. this proves
 *        the fix reaches the human through review.by, in the guard shape (`--for`) and the
 *        all-rubrics shape alike
 * .note = it also PINS a known gap, measured rather than hidden: review.by has no `constraint`
 *         verdict, so a caller-fixable refusal in a rubric's child review renders under a
 *         `💥 rubric malfunctioned` header and exits 1. the child's own `✋ ConstraintError` and
 *         its fix still render inside it. the repair is a review.by verdict-class change, owed
 *         by fulcrum F5 (dream `v2026_10_03.fix.review-by-constraint-verdict`). when it lands,
 *         flip the exit-1 and 💥 clamps to exit 2 and ✋
 * .note = the rendered frame is snapped from its header down, so the F5 flip shows in the diff.
 *         the keyrack metadata block inside it is rhachet's layout, pinned as the caller sees it
 */
describe('review.by.key-absent.acceptance', () => {
  const scene = useBeforeAll(async () => {
    const cwd = await genReviewByFixture({
      slug: 'review-by-key-absent',
      clone: ASSETS_DIR,
    });

    // an empty home: no host keyrack, so the key cannot be found
    const home = path.join(cwd, '.home-empty');
    await fs.mkdir(home, { recursive: true });

    return { cwd, home };
  });

  given('[case1] OPENROUTER_API_KEY is absent from env and keyrack', () => {
    when('[t0] a guard runs review.by --for one rubric', () => {
      const result = useThen('review.by refuses', async () =>
        invokeReviewByWithKeyAbsent({
          cwd: scene.cwd,
          home: scene.home,
          for: 'demo-arrow-only',
        }),
      );

      then('CLAMP: the fix reaches the human — the key and the command that fills it', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('OPENROUTER_API_KEY');
        expect(output).toContain(KEY_SET_COMMAND);
      });

      then('CLAMP: the child refusal is named a ConstraintError', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('✋ ConstraintError');
      });

      then('GAP (F5): review.by frames it as a malfunction, exit 1', () => {
        // .why = pins today's behavior so the gap is visible. flip to exit 2 and ✋ when F5 lands
        expect(result.code).toEqual(1);
        expect(result.stdout + result.stderr).toContain(
          '💥 rubric malfunctioned: demo-arrow-only',
        );
      });

      then('the rendered refusal is pinned', () => {
        // .why = pinned from the frame header down, so the F5 flip from 💥 to ✋ shows in the diff
        const output = sanitizeTimeForSnapshot(result.stdout + result.stderr);
        expect(asFrameBlock({ output, hint: FRAME_HINT })).toMatchSnapshot();
      });
    });

    when('[t1] review.by runs every rubric of the role', () => {
      const result = useThen('review.by refuses', async () =>
        invokeReviewByWithKeyAbsent({
          cwd: scene.cwd,
          home: scene.home,
          for: null,
        }),
      );

      then('CLAMP: the fix reaches the human — the key and the command that fills it', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('OPENROUTER_API_KEY');
        expect(output).toContain(KEY_SET_COMMAND);
      });

      then('CLAMP: the child refusal is named a ConstraintError', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('✋ ConstraintError');
      });

      then('GAP (F5): review.by frames it as a malfunction, exit 1', () => {
        expect(result.code).toEqual(1);
        expect(result.stdout + result.stderr).toContain(
          '💥 rubric malfunctioned: demo-arrow-only',
        );
      });

      then('the rendered refusal is pinned', () => {
        const output = sanitizeTimeForSnapshot(result.stdout + result.stderr);
        expect(asFrameBlock({ output, hint: FRAME_HINT })).toMatchSnapshot();
      });
    });
  });
});
