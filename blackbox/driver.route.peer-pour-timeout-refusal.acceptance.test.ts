import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  asChildEnv,
  execAsync,
  genTempDirForRhachet,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

// 🔴 .why this suite SHARES the fallback suite's fixture rather than clones it =
//    both reach their reader through the same route: a guard that pours one peer
//    reviewer at `1.execute`, with no self-review gate ahead of it. a second copy
//    of that fixture would be a drift surface with no distinction to buy — the two
//    suites differ in the ENV VAR they set, never in the scene they set it against
const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-fallback-timeout-refusal',
);

/**
 * .mock = the peer reviewer subprocess (`.test/mock-review-prose.sh`)
 * .why = a synthetic reviewer drives the pour deterministically with no LLM call and no
 *        credentials. and here it is never even executed: the refusal under test fires at
 *        `getReviewTimeoutMs()`, which runs BEFORE any lane is spawned, so every case in
 *        this suite exits while the mock is still an unread file on disk.
 * .real = `driver.route.peer-budget-*` suites exercise real reviewer subprocesses; this
 *         suite deliberately stops at the pour-phase env read.
 *
 * 🔴 .note = its sibling `driver.route.peer-fallback-timeout-refusal` carries the same
 *    block against the same fixture and the same executable. the two part on ONE word:
 *    that one refuses at `getFallbackTimeoutMs()` (the tally phase, after a lane has run
 *    and returned unreadable stdout); this one refuses at `getReviewTimeoutMs()` (the
 *    pour phase, before a lane exists). ⇒ the mock is unspawned in both, for two
 *    different reasons, and a reader who has only one of the two blocks cannot tell which
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
 * 🔴 .what = the acceptance clamp on `RHACHET_REVIEW_TIMEOUT_MS` as read AT THE POUR
 *
 * .why = three readers were routed through `asGuardPositiveInt`, and each is a distinct
 *        caller-encounterable surface with its own `at:` field in the rendered bytes:
 *
 *        | reader | reached by | its oracle |
 *        |---|---|---|
 *        | `stepReview.getReviewTimeoutMs` | `rhx review` | `review.timeout-env-refusals.acceptance.test.ts.snap` |
 *        | `getReviewCountsViaBrain.getFallbackTimeoutMs` | the guard's TALLY phase | `driver.route.peer-fallback-timeout-refusal.acceptance.test.ts.snap` |
 *        | 🔴 `runOneReview.getReviewTimeoutMs` | the guard's POUR phase | **this file** |
 *
 * ⚠️ .why the third was unpinned = it was asserted only at the unit grain, via
 *    `asGuardPositiveInt.test.ts`. that proves the TRANSFORMER refuses; it does not pin
 *    the bytes a driver reads when a guard pours a lane under a malformed env var.
 *    `rule.require.contract-snapshot-exhaustiveness` admits no "same template" exemption —
 *    the `at:` field IS part of the rendered contract, so a copy-paste that left another
 *    reader's env-var name behind would ship with no diff to see. raised as nitpick.1 by
 *    `ergo-contract-snapshots` at i020.
 *
 * 🔴 .why it is reachable at all, and cheaply = `getReviewTimeoutMs` is called at
 *    `runOneReview.ts`'s timeout computation, which precedes the subprocess capture. so a
 *    malformed env var throws BEFORE the reviewer child is ever spawned — the mock reviewer
 *    in the shared fixture never runs, and no brain, credential, or LLM call is touched.
 *
 * 🔴 .why a NEW file rather than two more cases in the fallback suite = a jest snapshot key
 *    is `<describe> <given> <when> <then> N`. to widen that suite's `describe` — or to add
 *    cases under a name that no longer fits it — churns every committed key it already owns.
 *    a peer file keeps both oracles stable and lets each name the reader it grades.
 */
describe('driver.route.peer-pour-timeout-refusal.acceptance', () => {
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'peer-pour-timeout-refusal',
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

  given('[case1] RHACHET_REVIEW_TIMEOUT_MS is set to a non-integer', () => {
    const result = useThen('the pour refuses at the env read', async () =>
      invokeArriveWithEnv({
        cwd: scene.tempDir,
        env: { RHACHET_REVIEW_TIMEOUT_MS: 'abc' },
      }),
    );

    when('[t0] the stone arrives with RHACHET_REVIEW_TIMEOUT_MS=abc', () => {
      then('CLAMP: the message names THIS env var, never the other two', () => {
        // 🔴 .why = the whole reason the unit-grain assertion was insufficient. the
        //    three readers share a message template and differ ONLY in the `at:`
        //    field, so this is what catches a copy-paste that left another behind
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('RHACHET_REVIEW_TIMEOUT_MS');
        expect(output).not.toContain('RHACHET_FALLBACK_BRAIN_TIMEOUT_MS');
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

  given('[case2] RHACHET_REVIEW_TIMEOUT_MS is set to empty', () => {
    const result = useThen('the pour refuses at the env read', async () =>
      invokeArriveWithEnv({
        cwd: scene.tempDir,
        env: { RHACHET_REVIEW_TIMEOUT_MS: '' },
      }),
    );

    when('[t0] the stone arrives with RHACHET_REVIEW_TIMEOUT_MS= (empty)', () => {
      then('CLAMP: an empty string is refused, never absorbed as the default', () => {
        // ⚠️ .why = an empty string is `!== undefined`, so it reaches the transformer.
        //    a `NaN` bound here makes the subprocess timeout never compare true, so a
        //    hung reviewer runs UNBOUNDED — and this timeout is its only bound
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('RHACHET_REVIEW_TIMEOUT_MS');
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
