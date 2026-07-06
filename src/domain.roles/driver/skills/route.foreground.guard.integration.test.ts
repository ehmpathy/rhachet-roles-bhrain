import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';
import { promisify } from 'util';

const execAsync = promisify(exec);

const HOOK_PATH = path.join(__dirname, 'route.foreground.guard.sh');

// absolute path to bash, so a restricted-PATH invocation can still find the
// interpreter (only the hook's internal commands look up via the custom PATH).
const BASH_PATH = execSync('command -v bash').toString().trim();

/**
 * .what = build a temp bin dir that resolves `dirname` but NOT `jq`
 * .why = proves the guard's jq-absent path (exit 2). the hook needs `dirname`
 *        to compute SCRIPT_DIR before it checks for jq, so we symlink only that
 *        one dependency and omit jq — so `command -v jq` fails.
 */
const genJqlessBinDir = (): string => {
  const binDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'foreground-guard-nojq-'),
  );
  const dirnamePath = execSync('command -v dirname').toString().trim();
  const linkPath = path.join(binDir, 'dirname');
  try {
    fs.symlinkSync(dirnamePath, linkPath);
  } catch {
    // some filesystems reject symlinks — a copy resolves the dependency too
    fs.copyFileSync(dirnamePath, linkPath);
    fs.chmodSync(linkPath, 0o755);
  }
  return binDir;
};

/**
 * .what = narrow an unknown catch value to a real bash process-exit error
 * .why = the only expected throw from execAsync is a process exit that carries a
 *        NUMERIC exit code (e.g. 2 = guard block). a type guard (not an `as`
 *        cast) proves the shape at runtime, so genuine bugs — spawn errors like
 *        ENOENT (string code), or non-exec throws — are never swallowed.
 */
const isProcessExitError = (
  error: unknown,
): error is { stdout?: string; stderr?: string; code: number } => {
  if (typeof error !== 'object' || error === null) return false;
  if (!('code' in error)) return false;
  return typeof error.code === 'number';
};

/**
 * .what = run a shell command and capture stdout, stderr, and exit code
 * .why = shared by every hook invocation form (normal, malformed-json,
 *        jq-absent). a real process exit — proven by the type guard — is the
 *        only expected throw; anything else is rethrown so bugs never hide.
 */
const runShell = async (
  cmd: string,
): Promise<{ stdout: string; stderr: string; code: number }> => {
  try {
    const result = await execAsync(cmd);
    return { ...result, code: 0 };
  } catch (error) {
    if (!isProcessExitError(error)) throw error;
    return {
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
      code: error.code,
    };
  }
};

/**
 * .what = embed a value inside a single-quoted shell string safely
 * .why = standard posix idiom (close quote, emit an escaped quote, reopen).
 *        keeps a payload intact even if it ever contains a single quote.
 */
const asSingleQuoteSafe = (raw: string): string => raw.replace(/'/g, `'\\''`);

/**
 * .what = invoke the route.foreground.guard.sh hook with a stdin payload
 * .why = layer (a) of the two-layer acceptance check — exercise the hook's
 *        decision logic deterministically via synthetic stdin. layer (b), the
 *        live-harness smoke check, is recorded in 5.1.execution.from_vision.yield.md
 *        (it cannot run inside jest, which has no Claude Code harness).
 */
const invokeHook = async (input: {
  tool_name: string;
  tool_input: {
    command?: string;
    run_in_background?: boolean | string;
    file_path?: string;
  };
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const stdinJson = JSON.stringify(input);
  const cmd = `echo '${asSingleQuoteSafe(stdinJson)}' | bash "${HOOK_PATH}" --mode hook`;
  return runShell(cmd);
};

// ── acceptance: two layers ──────────────────────────────────────────
// the vision mandates a two-layer acceptance check.
//
// layer (a) — isolated unit coverage — is this whole suite: it drives the
// hook via synthetic stdin across block, allow, and failure paths, and snaps
// every step so the contract is locked and vibecheckable.
//
// layer (b) — live-harness smoke check — cannot run inside jest (jest has no
// Claude Code harness). it was performed by hand in a real session: a genuine
// `route.stone.set` was invoked with `run_in_background: true` (the actual Bash
// tool, not a synthetic payload). the harness fired the PreToolUse hook and
// blocked the call before it ran. captured stderr:
//
//   PreToolUse:Bash hook error: [./node_modules/.bin/rhx route.foreground.guard --mode hook]:
//   🦉 walk this path in the open, not in shadow. be present.
//   🗿 route.foreground guard
//      ├─ skill = route.stone.set
//      ├─ mode = background
//      ├─ access = blocked
//      └─ instead, run it in the foreground
//
// what layer (b) proves that (a) cannot: the harness actually fires PreToolUse
// for a `run_in_background: true` Bash call and honors exit 2 to block it.
// full record: 5.1.execution.from_vision.yield.md.
//
// note on the `useThen` pattern below:
// `useThen` (from test-fns) does NOT return a raw Promise. it registers a
// `then` step that runs the async body, and returns a deferred-access PROXY.
// each peer `then` block reads the RESOLVED value synchronously (e.g.
// `result.code`), because the proxy resolves before those assertions run.
// this is the documented test-fns idiom to share one result across many
// assertions without redundant calls — see brief
// rule.require.useThen-useWhen-for-shared-results. the assertions that pass
// confirm the resolved values are read, not an unresolved promise.
describe('route.foreground.guard', () => {
  given('[case1] route.stone.set in background', () => {
    when('[t0] rhx form', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command: 'rhx route.stone.set --stone 1.vision --as passed',
            run_in_background: true,
          },
        }),
      );

      then('exits with code 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr reports the block', () => {
        expect(result.stderr).toContain('blocked');
      });

      then('stderr guides to the foreground', () => {
        expect(result.stderr).toContain('foreground');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] npx rhachet run --skill form', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command:
              'npx rhachet run --skill route.stone.set --stone 1.vision --as passed',
            run_in_background: true,
          },
        }),
      );

      then('exits with code 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t2] ./node_modules/.bin/rhx form', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command:
              './node_modules/.bin/rhx route.stone.set --stone 1.vision --as arrived',
            run_in_background: true,
          },
        }),
      );

      then('exits with code 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case2] route.stone.set in foreground', () => {
    when('[t0] run_in_background is false', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command: 'rhx route.stone.set --stone 1.vision --as passed',
            run_in_background: false,
          },
        }),
      );

      then('exits with code 0 (allowed)', () => {
        expect(result.code).toEqual(0);
      });

      then('stderr is empty (no block) — snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] run_in_background absent', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command: 'rhx route.stone.set --stone 1.vision --as passed',
          },
        }),
      );

      then('exits with code 0 (allowed)', () => {
        expect(result.code).toEqual(0);
      });

      then('stderr is empty (no block) — snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case3] a different command in background', () => {
    when('[t0] git.repo.test in background', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command: 'rhx git.repo.test --what unit',
            run_in_background: true,
          },
        }),
      );

      then('exits with code 0 (allowed — not route.stone.set)', () => {
        expect(result.code).toEqual(0);
      });

      then('stderr is empty (no block) — snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] route.stone.get in background (a peer skill)', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command: 'rhx route.stone.get --stone 1.vision',
            run_in_background: true,
          },
        }),
      );

      then('exits with code 0 (allowed — not route.stone.set)', () => {
        expect(result.code).toEqual(0);
      });

      then('stderr is empty (no block) — snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case4] non-Bash tool', () => {
    when('[t0] Read tool, background flag present', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Read',
          tool_input: {
            file_path: '.behavior/example/1.vision.stone',
            run_in_background: true,
          },
        }),
      );

      then('exits with code 0 (allowed — not the Bash tool)', () => {
        expect(result.code).toEqual(0);
      });

      then('stderr is empty (no block) — snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case5] boundary edges (fail-open)', () => {
    when('[t0] Bash tool, background, empty command', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command: '',
            run_in_background: true,
          },
        }),
      );

      then('exits with code 0 (allowed — no command to match)', () => {
        expect(result.code).toEqual(0);
      });

      then('stderr is empty (no block) — snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] every-as form is blocked (arrived, blocked, approved)', () => {
      const arrived = useThen('arrived form invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command: 'rhx route.stone.set --stone 1.vision --as arrived',
            run_in_background: true,
          },
        }),
      );
      const blocked = useThen('blocked form invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command: 'rhx route.stone.set --stone 1.vision --as blocked',
            run_in_background: true,
          },
        }),
      );
      const approved = useThen('approved form invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command: 'rhx route.stone.set --stone 1.vision --as approved',
            run_in_background: true,
          },
        }),
      );

      then('all --as variants are blocked (exit 2)', () => {
        expect(arrived.code).toEqual(2);
        expect(blocked.code).toEqual(2);
        expect(approved.code).toEqual(2);
      });

      then('block message is identical across --as variants — snapshot', () => {
        expect(arrived.stderr).toEqual(blocked.stderr);
        expect(blocked.stderr).toEqual(approved.stderr);
        expect(arrived.stderr).toMatchSnapshot();
      });
    });

    when('[t2] a chained command with route.stone.set in background', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command:
              'cd repo && rhx route.stone.set --stone 1.vision --as passed',
            run_in_background: true,
          },
        }),
      );

      then('exits with code 2 (blocked — no bypass via chain)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case6] infrastructure failure paths (fail loud, not silent)', () => {
    when('[t0] jq is not available on PATH', () => {
      // run the hook with a PATH that resolves `dirname` (for SCRIPT_DIR) but
      // omits jq — the guard must halt loudly rather than silently allow.
      const result = useThen('hook is invoked without jq', async () => {
        const binDir = genJqlessBinDir();
        const payload = JSON.stringify({
          tool_name: 'Bash',
          tool_input: {
            command: 'rhx route.stone.set --stone 1.vision --as passed',
            run_in_background: true,
          },
        });
        const cmd = `echo '${asSingleQuoteSafe(payload)}' | env PATH='${binDir}' '${BASH_PATH}' "${HOOK_PATH}" --mode hook`;
        return runShell(cmd);
      });

      then('exits with code 2 (blocked — jq absent, fail loud)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr names jq as the absent dependency', () => {
        expect(result.stderr).toContain('jq is required');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] stdin is malformed json', () => {
      // a real parse fault must fail loud (exit 1), never be swallowed.
      const result = useThen('hook is invoked with bad json', async () => {
        const cmd = `echo 'this is not json' | bash "${HOOK_PATH}" --mode hook`;
        return runShell(cmd);
      });

      then('exits with code 1 (malfunction — parse fault)', () => {
        expect(result.code).toEqual(1);
      });

      then('stderr reports the parse failure', () => {
        expect(result.stderr).toContain('failed to parse');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t2] run_in_background is a non-boolean value', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command: 'rhx route.stone.set --stone 1.vision --as passed',
            run_in_background: 'yes',
          },
        }),
      );

      then('exits with code 0 (allowed — only literal true blocks)', () => {
        expect(result.code).toEqual(0);
      });

      then('stderr is empty (no block) — snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case7] path precision for the .bin/rhx form', () => {
    when('[t0] an unrelated other/bin/rhx path in background', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command:
              'other/bin/rhx route.stone.set --stone 1.vision --as passed',
            run_in_background: true,
          },
        }),
      );

      then('exits with code 0 (allowed — not node_modules/.bin/rhx)', () => {
        expect(result.code).toEqual(0);
      });

      then('stderr is empty (no block) — snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] the real node_modules/.bin/rhx path in background', () => {
      const result = useThen('hook is invoked', async () =>
        invokeHook({
          tool_name: 'Bash',
          tool_input: {
            command:
              './node_modules/.bin/rhx route.stone.set --stone 1.vision --as passed',
            run_in_background: true,
          },
        }),
      );

      then('exits with code 2 (blocked — anchored path still matches)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });
});
