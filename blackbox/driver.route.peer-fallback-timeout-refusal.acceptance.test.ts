import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  asChildEnv,
  execAsync,
  genTempDirForRhachet,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-fallback-timeout-refusal',
);

/**
 * .mock = the peer reviewer subprocess (`.test/mock-review-prose.sh`)
 * .why = the fallback tally path is reached only when a reviewer's stdout carries no
 *        numeric count. a synthetic prose-only reviewer drives that deterministically
 *        with no LLM call and no credentials — and the env refusal under test fires at
 *        `getFallbackTimeoutMs()`, which runs BEFORE the sub-brain ask, so no brain is
 *        ever built either.
 * .real = `driver.route.peer-budget-*` suites exercise real reviewer subprocesses; this
 *         suite deliberately stops at the tally-phase env read.
 */

/**
 * .what = arrives a stone with an env override applied to the child
 * .why = this suite invokes the skill directly rather than through `invokeRouteSkill`,
 *        because the refusal must be observed on a RAW child whose env this test owns.
 *
 * 🔴 .note = the env itself is built by the shared `asChildEnv`, never hand-rolled. its
 *    `undefined`-deletes-the-key semantics carry real weight, and three hand-rolled
 *    copies of them were the defect `ergo-acceptance-journey-coverage` raised at i019.
 */
const invokeArriveWithEnv = async (input: {
  cwd: string;
  env: Record<string, string | undefined>;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=driver/skills/route.stone.set.sh',
  );

  const cmd = `bash "${skillPath}" --stone 1.execute --route . --as passed`;

  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: asChildEnv({ overrides: input.env }),
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

/**
 * 🔴 .what = the acceptance clamp on the THIRD timeout env var's rendered refusal
 *
 * .why = `RHACHET_FALLBACK_BRAIN_TIMEOUT_MS` is the third reader routed through
 *        `asGuardPositiveInt`, and the only one the sibling suite
 *        `review.timeout-env-refusals.acceptance.test.ts` could not reach — it is read
 *        inside `getReviewCountsViaBrain`, at the guard's TALLY phase, never via
 *        `rhx review`.
 *
 * ⚠️ .why the carve-out did NOT hold = that sibling's docblock deferred this variant on
 *    the ground that it *"shares the same template … and differs only in the `at:`
 *    field."* `rule.require.contract-snapshot-exhaustiveness` refuses exactly that: the
 *    `at:` field IS part of the rendered bytes, so this is a distinct caller-facing
 *    contract that can drift on its own — a wrong env-var name or a dropped quote would
 *    ship with no diff to see. raised as blocker.1 by `ergo-contract-snapshots` at i018.
 *
 * 🔴 .why it is reachable at all, and cheaply = `getFallbackTimeoutMs()` is called at the
 *    head of the fallback, BEFORE the sub-brain ask is built. so a prose-only reviewer
 *    plus a malformed env var throws at the env read — no brain, no credentials, no cost.
 */
describe('driver.route.peer-fallback-timeout-refusal.acceptance', () => {
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'peer-fallback-timeout-refusal',
      clone: ASSETS_DIR,
    });

    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-prose.sh', { cwd: tempDir });

    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'src', 'feature.ts'),
      'export const feature = () => "v1";',
    );

    return { tempDir };
  });

  // 🔴 .why both `abc` and the empty string are pinned = `declares "abc"` and
  //     `declares ""` are distinct byte strings, and the rule closes on RENDERED
  //     shape. these are the two malformed variants a shell profile typo produces:
  //     a stray string, and an assignment with no value.

  given('[case1] RHACHET_FALLBACK_BRAIN_TIMEOUT_MS is set to a non-integer', () => {
    const result = useThen('the tally refuses at the env read', async () =>
      invokeArriveWithEnv({
        cwd: scene.tempDir,
        env: { RHACHET_FALLBACK_BRAIN_TIMEOUT_MS: 'abc' },
      }),
    );

    when('[t0] the stone arrives with RHACHET_FALLBACK_BRAIN_TIMEOUT_MS=abc', () => {
      then('CLAMP: the message names THIS env var, never a sibling', () => {
        // 🔴 .why = the whole reason the carve-out failed. the three readers share a
        //    message template and differ ONLY in the `at:` field, so this assertion is
        //    what would catch a copy-paste that left a sibling's name behind
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('RHACHET_FALLBACK_BRAIN_TIMEOUT_MS');
        expect(output).not.toContain('RHACHET_REVIEW_TIMEOUT_MS');
      });

      then('CLAMP: the declared value is quoted back verbatim', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('declares "abc"');
      });

      then('the refusal renders as an error, never a stack trace', () => {
        expect(
          sanitizeTimeForSnapshot(result.stdout + result.stderr),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] RHACHET_FALLBACK_BRAIN_TIMEOUT_MS is set to empty', () => {
    const result = useThen('the tally refuses at the env read', async () =>
      invokeArriveWithEnv({
        cwd: scene.tempDir,
        env: { RHACHET_FALLBACK_BRAIN_TIMEOUT_MS: '' },
      }),
    );

    when('[t0] the stone arrives with RHACHET_FALLBACK_BRAIN_TIMEOUT_MS= (empty)', () => {
      then('CLAMP: an empty string is refused, never absorbed as the default', () => {
        // ⚠️ .why = this reader's guard was the LOOSEST of the three — `if (override)`,
        //    a truthiness test, so an empty string fell through to the default and a
        //    `'0'` armed a timer that fires at once. the `!== undefined` read plus
        //    `asGuardPositiveInt` closes both; this pins the empty half
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('RHACHET_FALLBACK_BRAIN_TIMEOUT_MS');
      });

      then('the refusal renders `declares ""` — distinct from the abc variant', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('declares ""');
        expect(
          sanitizeTimeForSnapshot(result.stdout + result.stderr),
        ).toMatchSnapshot();
      });
    });
  });
});
