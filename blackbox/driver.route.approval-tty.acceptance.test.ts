import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ASSETS_DIR = path.join(
  __dirname,
  '../src/domain.operations/route/.test/assets',
);

const BLACKBOX_ASSETS_DIR = path.join(__dirname, '.test/assets');

/**
 * .what = helper to invoke route.stone.set via cli
 * .why = enables acceptance test of the full cli flow
 */
const invokeRouteStoneSet = async (input: {
  tempDir: string;
  stone: string;
  as: 'passed' | 'approved' | 'promised';
  that?: string;
  env?: Record<string, string>;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const thatArg = input.that ? `--that ${input.that}` : '';
  const cmd = `npx tsx -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStoneSet())" -- --stone ${input.stone} --route ${input.tempDir} --as ${input.as} ${thatArg}`;
  try {
    const result = await execAsync(cmd, {
      cwd: process.cwd(),
      env: { ...process.env, ...input.env },
    });
    return { stdout: result.stdout, stderr: result.stderr, code: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout: string;
      stderr: string;
      code: number;
    };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code ?? 1,
    };
  }
};

describe('driver.route.approval-tty', () => {
  given('[case1] agent session (non-TTY)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-approval-tty-agent-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] agent runs --as approved', () => {
      then('command fails', async () => {
        // non-tty because execAsync runs in subprocess
        // NODE_ENV=production + CI='' simulates real agent (non-test, non-CI) environment
        const result = await invokeRouteStoneSet({
          tempDir,
          stone: '1.vision',
          as: 'approved',
          env: { NODE_ENV: 'production', CI: '' },
        });
        expect(result.code).not.toBe(0);
      });

      then('output shows guidance', async () => {
        // NODE_ENV=production + CI='' simulates real agent (non-test, non-CI) environment
        const result = await invokeRouteStoneSet({
          tempDir,
          stone: '1.vision',
          as: 'approved',
          env: { NODE_ENV: 'production', CI: '' },
        });
        expect(result.stdout).toContain('only humans can approve');
        expect(result.stdout).toContain('--as passed');
        expect(result.stdout).toContain('--as arrived');
        expect(result.stdout).toContain('--as blocked');
      });
    });
  });

  // 🔴 .note = there is NO [case2] here, and its absence is deliberate.
  //
  // this file once carried a `[case2] human session (TTY)` whose only body was
  // `expect(true).toBe(true)`, under a `then` named "acceptance skipped - unit tests
  // cover this path". that is `rule.forbid.failhide` verbatim — an assertion that
  // always passes, which reports coverage where none is exercised. a green tick on a
  // vacuous case is worse than an absent case: it tells a reviewer the TTY path is
  // covered AT THIS GRAIN, and it is not.
  //
  // ✅ the coverage it claimed is real, and it is at the OPERATION grain:
  //    setStoneAsApproved.test.ts [case1] drives `{ isTTY: true }` (:35, :44, :52 —
  //    return value, snapshot, and the passage.jsonl append), and [case3]/[case4]
  //    drive `{ isTTY: false }`. so no coverage was lost with the case; only the
  //    false claim of ACCEPTANCE-grain coverage was.
  //
  // ⚠️ the residual gap is real and is tracked, not hidden: no acceptance test drives
  //    a true TTY, because `execAsync` spawns a non-tty subprocess. a real one needs a
  //    pty, which is out of this behavior's bounds — see
  //    .dream/v2026_09_07.fix.no-acceptance-test-drives-a-real-tty.md

  given('[case3] hook guidance format', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-approval-tty-hook-${Date.now()}`,
    );

    beforeEach(async () => {
      // use approval-test fixture with mock judge that properly exits 2
      await fs.cp(
        path.join(BLACKBOX_ASSETS_DIR, 'route.approval-test'),
        tempDir,
        { recursive: true },
      );
      // create artifact and fail pass to create blocker report
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
      await invokeRouteStoneSet({
        tempDir,
        stone: '1.vision',
        as: 'passed',
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] agent blocked on approval and runs route.drive hook', () => {
      then('hook shows approval command', async () => {
        // run route.drive --mode hook to see the guidance
        const cmd = `npx tsx -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeDrive())" -- --route ${tempDir} --when hook.onBoot`;
        let result: { stdout: string; stderr: string; code: number };
        try {
          const execResult = await execAsync(cmd, { cwd: process.cwd() });
          result = { stdout: execResult.stdout, stderr: execResult.stderr, code: 0 };
        } catch (error: unknown) {
          const execError = error as { stdout: string; stderr: string; code: number };
          result = {
            stdout: execError.stdout ?? '',
            stderr: execError.stderr ?? '',
            code: execError.code ?? 1,
          };
        }

        // hook allows stop (exit 0) when blocked on approval
        expect(result.code).toBe(0);
        // check for approval command format
        expect(result.stdout).toContain('--as approved');
      });

      then('hook shows "once they do, run"', async () => {
        const cmd = `npx tsx -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeDrive())" -- --route ${tempDir} --when hook.onBoot`;
        let result: { stdout: string; stderr: string; code: number };
        try {
          const execResult = await execAsync(cmd, { cwd: process.cwd() });
          result = { stdout: execResult.stdout, stderr: execResult.stderr, code: 0 };
        } catch (error: unknown) {
          const execError = error as { stdout: string; stderr: string; code: number };
          result = {
            stdout: execError.stdout ?? '',
            stderr: execError.stderr ?? '',
            code: execError.code ?? 1,
          };
        }

        // check for pass command format
        expect(result.stdout).toContain('once they do, run');
        expect(result.stdout).toContain('--as passed');
      });
    });
  });
});
