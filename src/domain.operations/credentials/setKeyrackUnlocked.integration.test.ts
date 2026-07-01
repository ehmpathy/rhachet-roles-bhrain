import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * .what = integration tests for setKeyrackUnlocked
 * .why = verify the helper forwards keyrack's own output + exit code on failure,
 *        and stays silent on success — without a live keyrack daemon
 *
 * .note = uses a FAKE rhx binary (not a mock) placed at the child's
 *         ./node_modules/.bin/rhx so we can drive success/failure deterministically
 * .note = runs the helper in a CHILD process (via tsx) because it calls process.exit,
 *         which would otherwise kill the jest runner
 */

// absolute path to the helper source (required by the child process)
const HELPER_PATH = path.join(__dirname, 'setKeyrackUnlocked.ts');

// absolute path to the repo's tsx binary (jest cwd is the repo root)
const TSX_BIN = path.resolve('node_modules/.bin/tsx');

/**
 * .what = write a fake rhx binary into <dir>/node_modules/.bin/rhx
 * .why = lets the child's `./node_modules/.bin/rhx` point at an executable we control;
 *        the fake records its args and emits the given output + exit code
 */
const setFakeRhx = (input: {
  dir: string;
  stdout: string;
  stderr: string;
  exit: number;
}): void => {
  const binDir = path.join(input.dir, 'node_modules', '.bin');
  fs.mkdirSync(binDir, { recursive: true });
  const rhxPath = path.join(binDir, 'rhx');
  const body = [
    '#!/usr/bin/env bash',
    // record the args passed by the helper for assertion
    `printf '%s' "$*" > "${path.join(input.dir, 'rhx.args.txt')}"`,
    `printf '%s' ${JSON.stringify(input.stdout)}`,
    `printf '%s' ${JSON.stringify(input.stderr)} >&2`,
    `exit ${input.exit}`,
    '',
  ].join('\n');
  fs.writeFileSync(rhxPath, body, { mode: 0o755 });
};

/**
 * .what = run setKeyrackUnlocked in a child process from the given cwd
 * .why = contains the helper's process.exit within the child so we can observe
 *        its forwarded stdout/stderr and exit code
 */
const invokeHelper = async (input: {
  cwd: string;
  ci?: boolean;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const cmd = `${TSX_BIN} -e "require('${HELPER_PATH}').setKeyrackUnlocked({ owner: 'ehmpath', env: 'prep' })"`;
  // control the child's CI flag: the helper skips the daemon unlock when CI is set.
  // for spawn-behavior cases we must clear CI (jest itself runs with CI=true in ci).
  const childEnv = { ...process.env };
  if (input.ci) childEnv.CI = 'true';
  else delete childEnv.CI;
  try {
    const result = await execAsync(cmd, { cwd: input.cwd, env: childEnv });
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

describe('setKeyrackUnlocked', () => {
  given('[case1] keyrack unlock fails (locked/absent)', () => {
    when('[t0] the helper is invoked', () => {
      const res = useThen('it runs against a failing fake rhx', async () => {
        const dir = genTempDir({ slug: 'set-keyrack-unlocked-fail' });
        setFakeRhx({
          dir,
          stdout: '🔓 keyrack unlock\n   └─ ✋ FAKE_LOCKED_MESSAGE\n',
          stderr: 'FAKE_STDERR_LINE\n',
          exit: 2,
        });
        const cli = await invokeHelper({ cwd: dir });
        const args = fs.readFileSync(path.join(dir, 'rhx.args.txt'), 'utf-8');
        return { cli, args };
      });

      then('it invokes keyrack unlock with owner + env flags', () => {
        expect(res.args).toContain('keyrack unlock');
        expect(res.args).toContain('--owner ehmpath');
        expect(res.args).toContain('--env prep');
      });

      then("it forwards keyrack's stdout verbatim", () => {
        expect(res.cli.stdout).toContain('FAKE_LOCKED_MESSAGE');
      });

      then("it forwards keyrack's stderr verbatim", () => {
        expect(res.cli.stderr).toContain('FAKE_STDERR_LINE');
      });

      then("it propagates keyrack's exit code", () => {
        expect(res.cli.code).toEqual(2);
      });
    });
  });

  given('[case2] keyrack unlock succeeds', () => {
    when('[t0] the helper is invoked', () => {
      const res = useThen('it runs against a passing fake rhx', async () => {
        const dir = genTempDir({ slug: 'set-keyrack-unlocked-pass' });
        setFakeRhx({
          dir,
          stdout: '🔓 keyrack unlock SUCCESS_NOISE\n',
          stderr: '',
          exit: 0,
        });
        const cli = await invokeHelper({ cwd: dir });
        return { cli };
      });

      then('it exits with code 0', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('it stays silent (does not forward success output)', () => {
        expect(res.cli.stdout).not.toContain('SUCCESS_NOISE');
        expect(res.cli.stdout).toEqual('');
      });
    });
  });

  given('[case3] in CI (creds come via keyrack firewall env)', () => {
    when('[t0] the helper is invoked with CI set', () => {
      const res = useThen(
        'it runs with CI=true against a fake rhx that would fail',
        async () => {
          const dir = genTempDir({ slug: 'set-keyrack-unlocked-ci' });
          // fake rhx would fail if called — proves the daemon unlock is skipped in CI
          setFakeRhx({
            dir,
            stdout: 'SHOULD_NOT_APPEAR\n',
            stderr: 'SHOULD_NOT_APPEAR_ERR\n',
            exit: 2,
          });
          const cli = await invokeHelper({ cwd: dir, ci: true });
          const spawned = fs.existsSync(path.join(dir, 'rhx.args.txt'));
          return { cli, spawned };
        },
      );

      then('it does not invoke keyrack unlock (no daemon in CI)', () => {
        expect(res.spawned).toEqual(false);
      });

      then('it exits 0 and stays silent', () => {
        expect(res.cli.code).toEqual(0);
        expect(res.cli.stdout).toEqual('');
      });
    });
  });
});
