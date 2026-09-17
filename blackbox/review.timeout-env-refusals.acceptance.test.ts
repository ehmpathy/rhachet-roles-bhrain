import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  asChildEnv,
  execAsync,
  genTempDirForRhachet,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

/**
 * .what = invokes the review skill with an env override, without a brain call
 * .why = the timeout env var refusal fires at `withSpinner` / `getReviewTimeoutMs`,
 *        BEFORE the brain call — so a bad `RHACHET_REVIEW_TIMEOUT_MS` yields a
 *        `BadRequestError` (exit 2) from `rhx review` without any LLM round-trip.
 *        `invokeReviewSkill` inherits `process.env` with no override slot, so this
 *        helper adds one for the two cases that need it
 */
const invokeReviewWithEnv = async (input: {
  cwd: string;
  env: Record<string, string | undefined>;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=reviewer/skills/review.sh',
  );

  // 🔴 the child env comes from the shared `asChildEnv`, never hand-rolled here. its
  //    `undefined`-deletes-the-key semantics carry real weight, and three hand-rolled
  //    copies were the defect `ergo-acceptance-journey-coverage` raised at i019
  const childEnv = asChildEnv({ overrides: input.env });

  // invoke with a valid rules + paths pair so the refusal fires at the timeout
  // read rather than at an earlier validation step
  const cmd = [
    `bash "${skillPath}"`,
    `--rules 'rules/rule.require.what-why-headers.md'`,
    `--paths 'src/dirty.ts'`,
    `--output '/dev/null'`,
    `--focus push`,
    `--goal representative`,
    `--brain 'fireworks/deepseek/v4-flash'`,
  ].join(' ');

  try {
    const result = await execAsync(cmd, { cwd: input.cwd, env: childEnv as NodeJS.ProcessEnv });
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
 * .what = acceptance clamp on the rendered refusal for a malformed timeout env var
 * .why = this diff routes `RHACHET_REVIEW_TIMEOUT_MS` through `asGuardPositiveInt`,
 *        which throws a `BadRequestError` on a malformed value. the rendered message
 *        (`timeout must be a positive integer: env RHACHET_REVIEW_TIMEOUT_MS declares
 *        "..."`) is a new caller-encounterable surface that was NEVER acceptance-pinned.
 *        the unit suite proves the transformer refuses — this pins the rendered bytes
 *        a driver actually sees when they run `rhx review` with a bad env var set
 *        (rule.require.contract-snapshot-exhaustiveness)
 *
 * .note = `RHACHET_FALLBACK_BRAIN_TIMEOUT_MS` is not covered in THIS file, because it is
 *         read inside `getReviewCountsViaBrain` at the guard's tally phase — not
 *         reachable through `rhx review` at all.
 *
 * 🔴 ⚠️ it IS covered, in its own suite:
 *         `blackbox/driver.route.peer-fallback-timeout-refusal.acceptance.test.ts`.
 *
 *         this note previously carved it out on the ground that it *"shares the same
 *         template … and differs only in the `at:` field; the pattern is proven by these
 *         two cases."* that carve-out was refused by `ergo-contract-snapshots` at i018,
 *         and rightly: the `at:` field IS part of the rendered bytes, so the third
 *         reader is a distinct caller-facing contract that can drift alone — a wrong
 *         env-var name or a dropped quote would ship with no diff to see.
 *
 *         ⇒ `rule.require.contract-snapshot-exhaustiveness` admits no "same template"
 *           exemption, and *"unreachable from HERE"* is a reason to write a second
 *           suite rather than to leave a caller-facing surface unpinned
 */
describe('review.timeout-env-refusals.acceptance', () => {
  // scene shared across both cases (same fixture, same setup steps)
  //
  // 🔴 .why `useBeforeAll` and not a mutable `let` behind a getter = this scene
  //    was once an IIFE that closed over `let tempDir` and handed it out through
  //    a property getter. raised i020 by TWO lanes (r1 nitpick.2, r4 nitpick.1),
  //    and both were right on the same two counts:
  //
  //    - every peer acceptance suite in this diff builds its scene with
  //      `useBeforeAll`, so the odd shape cost a reader a re-read for no gain
  //    - the getter made the second `given` depend on the FIRST to populate the
  //      closure. a single-case re-run (`--scope name://case2`) therefore read a
  //      scene that setup never filled
  //
  //    ⇒ `useBeforeAll` returns a proxy that defers the read to access time, so
  //    each case resolves the scene on its own and the dependence is gone
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'review-timeout-env-refusals',
      clone: ASSETS_DIR,
    });

    await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });

    return { tempDir };
  });

  // 🔴 .why the `abc` case and the empty-string case are both pinned =
  //     `declares "abc"` and `declares ""` are distinct byte strings. the
  //     snapshot rule closes on RENDERED shape, so each variant is its own oracle.
  //     these two cover the only two malformed variants an operator is likely to
  //     produce from a shell profile typo: a stray string and an unset assignment

  given('[case1] RHACHET_REVIEW_TIMEOUT_MS is set to a non-integer', () => {
    when('[t0] the stone arrives with RHACHET_REVIEW_TIMEOUT_MS=abc', () => {
      const result = useThen('review refuses at the timeout read', async () =>
        invokeReviewWithEnv({
          cwd: scene.tempDir,
          env: { RHACHET_REVIEW_TIMEOUT_MS: 'abc' },
        }),
      );

      then('CLAMP: exit 2 — a constraint, never a malfunction', () => {
        // .why = a bad env var is a caller-fixable fault; `asGuardPositiveInt`
        //        throws `BadRequestError`, which the CLI maps to exit 2.
        //        a bare `not.toEqual(0)` would pass for exit 1 (malfunction) too —
        //        the exact gap that made i017/r2 tighten to `toEqual(2)`
        expect(result.code).toEqual(2);
      });

      then('CLAMP: the message names the env var and the fault', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('RHACHET_REVIEW_TIMEOUT_MS');
      });

      then('the refusal renders as an error, never a stack trace', () => {
        // .why = snapshot pins the RENDERED byte string so a change to the message
        //        template (e.g. a quote absent from the env var name) surfaces in diff.
        //        sanitizeTimeForSnapshot masks the volatile log-dir segment
        //        (<iso>.pid<pid>.<uuid>) so the oracle is stable across runs
        const output = sanitizeTimeForSnapshot(result.stdout + result.stderr);
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] RHACHET_REVIEW_TIMEOUT_MS is set to empty', () => {
    when('[t0] the stone arrives with RHACHET_REVIEW_TIMEOUT_MS= (empty)', () => {
      const result = useThen('review refuses at the timeout read', async () =>
        invokeReviewWithEnv({
          cwd: scene.tempDir,
          env: { RHACHET_REVIEW_TIMEOUT_MS: '' },
        }),
      );

      then('CLAMP: exit 2 — a constraint, never a malfunction', () => {
        // .why = an empty string is `!== undefined`, so it reaches
        //        `asGuardPositiveInt`. a NaN bound from `parseInt('')` would make
        //        every review time out at once — the exact failure the getter
        //        exists to prevent, reinstated by the knob that tunes it
        expect(result.code).toEqual(2);
      });

      then('CLAMP: the message names the env var and the fault', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('RHACHET_REVIEW_TIMEOUT_MS');
      });

      then('the refusal renders `declares ""` — distinct from the abc variant', () => {
        // .why = the empty-string byte string `declares ""` is the variant under
        //        test; [case1] pins `declares "abc"`. a regression that merged the
        //        two templates or removed the quotes would surface here.
        //        sanitizeTimeForSnapshot masks the volatile log-dir segment so the
        //        oracle is stable across runs
        const output = sanitizeTimeForSnapshot(result.stdout + result.stderr);
        expect(output).toMatchSnapshot();
      });
    });
  });
});
