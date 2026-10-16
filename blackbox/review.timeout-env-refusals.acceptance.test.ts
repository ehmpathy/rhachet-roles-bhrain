import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';
import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';

import { asExecResultOrThrow } from './.test/asExecResultOrThrow';
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

  // the child env comes from the shared `asChildEnv`, never hand-rolled here — its
  // `undefined`-deletes-the-key semantics carry real weight
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
    `--brain ${DEFAULT_TEST_BRAIN_VIA_CLI}`,
  ].join(' ');

  try {
    const result = await execAsync(cmd, { cwd: input.cwd, env: childEnv as NodeJS.ProcessEnv });
    return { ...result, code: 0 };
  } catch (error) {
    // a nonzero exit is a skill result; any other fault rethrows (rule.forbid.failhide)
    return asExecResultOrThrow({ error });
  }
};

/**
 * .what = acceptance clamp on the rendered refusal for a malformed timeout env var
 * .why = `RHACHET_REVIEW_TIMEOUT_MS` routes through `asGuardPositiveInt`, which throws
 *        `BadRequestError` on a malformed value. the unit suite proves the transformer
 *        refuses; this pins the rendered bytes a driver sees from `rhx review`
 *        (rule.require.contract-snapshot-exhaustiveness).
 *
 * .note = `RHACHET_FALLBACK_BRAIN_TIMEOUT_MS` is not covered here — it is read inside
 *         `getOneReviewCountsViaBrain` at the guard's tally phase, not reachable through
 *         `rhx review` at all. it is covered in its own suite:
 *         `blackbox/driver.route.peer-fallback-timeout-refusal.acceptance.test.ts` — a
 *         distinct caller-visible contract (its `at:` field can drift alone), so it
 *         earns a second suite rather than a shared-template exemption
 *         (rule.require.contract-snapshot-exhaustiveness).
 */
describe('review.timeout-env-refusals.acceptance', () => {
  // scene shared across both cases (same fixture, same setup steps)
  //
  // .why `useBeforeAll` and not a mutable `let` behind a getter = matches every peer
  //   acceptance suite's scene shape, and `useBeforeAll` returns a proxy that defers
  //   the read to access time — a single-case re-run (`--scope name://case2`) resolves
  //   its own scene, with no dependence on another case's setup having run first
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'review-timeout-env-refusals',
      clone: ASSETS_DIR,
    });

    await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });

    return { tempDir };
  });

  // .why the `abc` case and the empty-string case are both pinned = `declares "abc"`
  //   and `declares ""` are distinct byte strings, each its own oracle. these are the
  //   two malformed variants a shell profile typo is likely to produce.

  given('[case1] RHACHET_REVIEW_TIMEOUT_MS is set to a non-integer', () => {
    when('[t0] the stone arrives with RHACHET_REVIEW_TIMEOUT_MS=abc', () => {
      const result = useThen('review refuses at the timeout read', async () =>
        invokeReviewWithEnv({
          cwd: scene.tempDir,
          env: { RHACHET_REVIEW_TIMEOUT_MS: 'abc' },
        }),
      );

      then('CLAMP: exit 2 — a constraint, never a malfunction', () => {
        // a bad env var is a caller-fixable fault; `asGuardPositiveInt` throws
        // `BadRequestError`, which the CLI maps to exit 2. a bare `not.toEqual(0)`
        // would pass for exit 1 (malfunction) too, so the assertion is exact.
        expect(result.code).toEqual(2);
      });

      then('CLAMP: the message names the env var and the fault', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('RHACHET_REVIEW_TIMEOUT_MS');
        // the qualified header, held by an assertion and never by the snapshot alone
        expect(output).toContain('✋ ConstraintError:');
      });

      then('the refusal renders as an error, never a stack trace', () => {
        // the snapshot pins the rendered byte string, so a template change surfaces in
        // diff. sanitizeTimeForSnapshot masks the volatile log-dir segment.
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
        // an empty string is `!== undefined`, so it reaches `asGuardPositiveInt`. a
        // NaN bound from `parseInt('')` would make every review time out at once.
        expect(result.code).toEqual(2);
      });

      then('CLAMP: the message names the env var and the fault', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('RHACHET_REVIEW_TIMEOUT_MS');
        // the qualified header, held by an assertion and never by the snapshot alone
        expect(output).toContain('✋ ConstraintError:');
      });

      then('the refusal renders `declares ""` — distinct from the abc variant', () => {
        // `declares ""` is this variant's byte string; [case1] pins `declares "abc"`.
        // a merged template or dropped quote would surface here.
        const output = sanitizeTimeForSnapshot(result.stdout + result.stderr);
        expect(output).toMatchSnapshot();
      });
    });
  });
});
