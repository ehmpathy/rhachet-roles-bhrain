import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * .what = integration tests for setKeyrackUnlocked
 * .why = verify the get-then-unlock flow: when `keyrack get` already grants the cred we
 *        skip unlock and stay silent (CI firewall path); when it does not, we `keyrack
 *        unlock` and forward keyrack's own output + exit code on failure (local path)
 *
 * .note = uses a FAKE rhx binary (not a mock) placed at the child's
 *         ./node_modules/.bin/rhx so we can drive get + unlock deterministically
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
 *        the fake branches on the keyrack subcommand (get vs unlock), records each call,
 *        and emits the configured output + exit code per subcommand
 */
const setFakeRhx = (input: {
  dir: string;
  get: { stdout: string; stderr: string; exit: number };
  unlock: { stdout: string; stderr: string; exit: number };
}): void => {
  const binDir = path.join(input.dir, 'node_modules', '.bin');
  fs.mkdirSync(binDir, { recursive: true });
  const rhxPath = path.join(binDir, 'rhx');
  const callsFile = path.join(input.dir, 'rhx.calls.txt');
  const body = [
    '#!/usr/bin/env bash',
    // record every invocation's args (append; helper may call twice)
    `printf '%s\\n' "$*" >> "${callsFile}"`,
    'case "$*" in',
    '  *"keyrack get"*)',
    `    printf '%s' ${JSON.stringify(input.get.stdout)}`,
    `    printf '%s' ${JSON.stringify(input.get.stderr)} >&2`,
    `    exit ${input.get.exit} ;;`,
    '  *"keyrack unlock"*)',
    `    printf '%s' ${JSON.stringify(input.unlock.stdout)}`,
    `    printf '%s' ${JSON.stringify(input.unlock.stderr)} >&2`,
    `    exit ${input.unlock.exit} ;;`,
    'esac',
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
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const cmd = `${TSX_BIN} -e "require('${HELPER_PATH}').setKeyrackUnlocked({ owner: 'ehmpath', env: 'prep', key: 'FIREWORKS_API_KEY' })"`;
  try {
    const result = await execAsync(cmd, { cwd: input.cwd });
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
 * .what = read the recorded fake-rhx calls (empty string if none)
 */
const readCalls = (dir: string): string => {
  const callsFile = path.join(dir, 'rhx.calls.txt');
  return fs.existsSync(callsFile) ? fs.readFileSync(callsFile, 'utf-8') : '';
};

describe('setKeyrackUnlocked', () => {
  given('[case1] the cred is already grantable (CI firewall env)', () => {
    when('[t0] the helper is invoked', () => {
      const res = useThen(
        'it runs against a fake where get grants',
        async () => {
          const dir = genTempDir({ slug: 'set-keyrack-unlocked-get-grants' });
          setFakeRhx({
            dir,
            get: {
              stdout: '🔐 keyrack get GRANTED_NOISE\n',
              stderr: '',
              exit: 0,
            },
            // unlock would fail if called — proves it is skipped when get grants
            unlock: {
              stdout: 'SHOULD_NOT_APPEAR\n',
              stderr: 'SHOULD_NOT_APPEAR_ERR\n',
              exit: 2,
            },
          });
          const cli = await invokeHelper({ cwd: dir });
          return { cli, calls: readCalls(dir) };
        },
      );

      then('it probes with keyrack get for the key + owner + env', () => {
        expect(res.calls).toContain('keyrack get');
        expect(res.calls).toContain('--key FIREWORKS_API_KEY');
        expect(res.calls).toContain('--owner ehmpath');
        expect(res.calls).toContain('--env prep');
      });

      then('it does NOT invoke keyrack unlock (already available)', () => {
        expect(res.calls).not.toContain('keyrack unlock');
      });

      then('it exits 0 and stays silent', () => {
        expect(res.cli.code).toEqual(0);
        expect(res.cli.stdout).toEqual('');
        expect(res.cli.stdout).not.toContain('GRANTED_NOISE');
      });
    });
  });

  given('[case2] the cred is not yet available; unlock succeeds', () => {
    when('[t0] the helper is invoked', () => {
      const res = useThen(
        'it runs against a fake where get is absent but unlock grants',
        async () => {
          const dir = genTempDir({ slug: 'set-keyrack-unlocked-unlock-ok' });
          setFakeRhx({
            dir,
            get: {
              stdout: '',
              stderr: "credential 'FIREWORKS_API_KEY' is locked\n",
              exit: 2,
            },
            unlock: {
              stdout: '🔓 keyrack unlock SUCCESS_NOISE\n',
              stderr: '',
              exit: 0,
            },
          });
          const cli = await invokeHelper({ cwd: dir });
          return { cli, calls: readCalls(dir) };
        },
      );

      then('it probes with get, then unlocks for owner + env', () => {
        expect(res.calls).toContain('keyrack get');
        expect(res.calls).toContain('keyrack unlock');
        expect(res.calls).toContain('--owner ehmpath');
        expect(res.calls).toContain('--env prep');
      });

      then('it exits 0 and stays silent (unlock success is quiet)', () => {
        expect(res.cli.code).toEqual(0);
        expect(res.cli.stdout).not.toContain('SUCCESS_NOISE');
        expect(res.cli.stdout).toEqual('');
      });
    });
  });

  given('[case3] the cred is not available and unlock fails', () => {
    when('[t0] the helper is invoked', () => {
      const res = useThen(
        'it runs against a fake where both get and unlock fail',
        async () => {
          const dir = genTempDir({ slug: 'set-keyrack-unlocked-unlock-fail' });
          setFakeRhx({
            dir,
            get: { stdout: '', stderr: 'locked\n', exit: 2 },
            unlock: {
              stdout: '🔓 keyrack unlock\n   └─ ✋ FAKE_LOCKED_MESSAGE\n',
              stderr: 'FAKE_STDERR_LINE\n',
              exit: 2,
            },
          });
          const cli = await invokeHelper({ cwd: dir });
          return { cli };
        },
      );

      then("it forwards unlock's stdout verbatim", () => {
        expect(res.cli.stdout).toContain('FAKE_LOCKED_MESSAGE');
      });

      then("it forwards unlock's stderr verbatim", () => {
        expect(res.cli.stderr).toContain('FAKE_STDERR_LINE');
      });

      then("it propagates unlock's exit code", () => {
        expect(res.cli.code).toEqual(2);
      });
    });
  });
});
