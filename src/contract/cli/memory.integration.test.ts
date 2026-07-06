import { execSync } from 'child_process';
import { given, then, when } from 'test-fns';

/**
 * .what = the exact production invocation the learner onTool hook uses
 * .why = runs the real skill wrapper (memory.guard.sh --mode hook), which captures
 *        stdin into RHACHET_STDIN and execs the cli entrypoint — this exercises the
 *        whole conformant path end-to-end (wrapper + env-var handoff + ts guard),
 *        not a synthetic node -e that would mask the harness stdin-inheritance gap
 */
const GUARD_CMD =
  'bash src/domain.roles/learner/skills/memory.guard.sh --mode hook';

/**
 * .what = the shape execSync throws on a non-zero child exit
 * .why = node's child_process does not export a precise type for a piped-stdio
 *        ExecException; declare the minimal contract the guard depends on
 */
const isExecFailure = (
  error: unknown,
): error is { status: number; stderr: string } => {
  // narrow to a non-null object, then let the `in` guard expose `.status`
  // (no `as` cast needed — `'status' in error` refines the type)
  if (typeof error !== 'object' || error === null) return false;
  if (!('status' in error)) return false;
  return typeof error.status === 'number';
};

/**
 * .what = run the guard with a raw stdin string
 * .why = mirrors how the claude code harness pipes PreToolUse json to the hook;
 *        a raw string lets us also exercise empty + malformed inputs
 * .note = execSync throws only on non-zero exit — allowlist that shape, rethrow
 *         all else (ENOENT, module-not-found) so infra failures are not
 *         fail-hidden as a fake exit code
 */
const runGuardRaw = (
  rawInput: string,
): { exitCode: number; stderr: string } => {
  try {
    execSync(GUARD_CMD, {
      input: rawInput,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { exitCode: 0, stderr: '' };
  } catch (error) {
    if (!isExecFailure(error)) throw error;
    return { exitCode: error.status, stderr: error.stderr };
  }
};

/**
 * .what = run the guard with a PreToolUse payload object on stdin
 * .why = the common path — a valid tool invocation serialized to json
 */
const runGuard = (payload: unknown): { exitCode: number; stderr: string } =>
  runGuardRaw(JSON.stringify(payload));

describe('memoryGuard (integration)', () => {
  given('[case1] a Write to claude native memory', () => {
    when('[t0] the guard runs', () => {
      const result = runGuard({
        tool_name: 'Write',
        tool_input: {
          file_path: '/home/agent/.claude/projects/x/memory/MEMORY.md',
        },
      });

      then('it blocks with exit code 2', () => {
        expect(result.exitCode).toEqual(2);
      });

      then('it emits the owl redirect nudge to stderr', () => {
        expect(result.stderr).toContain('memory would fade');
        expect(result.stderr).toContain('.agent/repo=.this/role=any');
      });

      then('the nudge keeps the Q7 machine-local secrets safety floor', () => {
        // vision Q7: the nudge must never invite raw secrets/paths into durable
        // capture — it guides to generalize them and keep the literal out
        expect(result.stderr).toContain('secrets');
        expect(result.stderr).toContain('generalize them');
        expect(result.stderr).toContain('out of durable memory');
      });

      then('the nudge affirms the instinct (tone contract)', () => {
        // vision awkward #1: celebrate the instinct, do not punish it
        expect(result.stderr).toContain('the instinct is right');
      });

      then('the full nudge stderr matches snapshot', () => {
        // snapshot locks the entire user-faced output so any drift (reword,
        // reorder, dropped safety line) surfaces in review
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case2] a Write to a normal repo file', () => {
    when('[t0] the guard runs', () => {
      const result = runGuard({
        tool_name: 'Write',
        tool_input: { file_path: 'src/domain.operations/memory/foo.ts' },
      });

      then('it allows with exit code 0', () => {
        expect(result.exitCode).toEqual(0);
      });

      then('the allow variant matches snapshot (silent, no stderr)', () => {
        // snapshot the whole caller-faced result so the silent-allow contract
        // is visible in review and any future noise-on-allow drift surfaces
        expect(result).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] a Write to ~/.claude/settings.json (config, not memory)',
    () => {
      when('[t0] the guard runs', () => {
        const result = runGuard({
          tool_name: 'Write',
          tool_input: { file_path: '/home/agent/.claude/settings.json' },
        });

        then('it allows with exit code 0', () => {
          expect(result.exitCode).toEqual(0);
        });

        then('the allow variant matches snapshot (silent, no stderr)', () => {
          expect(result).toMatchSnapshot();
        });
      });
    },
  );

  given('[case4] a Bash write into a memory path', () => {
    when('[t0] the guard runs', () => {
      const result = runGuard({
        tool_name: 'Bash',
        tool_input: {
          command:
            'echo "note" | rhx teesafe /home/agent/.claude/projects/x/memory/note.md',
        },
      });

      then('it blocks with exit code 2', () => {
        expect(result.exitCode).toEqual(2);
      });

      then('the nudge renders the bash-extracted path', () => {
        // the path here comes from getMemoryPathFromBashWrite (a different code
        // path than Write's direct file_path) — assert + snapshot proves the
        // extracted path renders correctly in the user-faced nudge
        expect(result.stderr).toContain(
          '/home/agent/.claude/projects/x/memory/note.md',
        );
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case4b] an Edit to claude native memory', () => {
    when('[t0] the guard runs', () => {
      // Edit is in the matcher (Write|Edit|Bash) — prove it triggers the block
      // end-to-end, not just at the verdict layer
      const result = runGuard({
        tool_name: 'Edit',
        tool_input: {
          file_path: '/home/agent/.claude/projects/x/memory/user_role.md',
        },
      });

      then('it blocks with exit code 2', () => {
        expect(result.exitCode).toEqual(2);
      });

      then('it emits the owl redirect nudge to stderr', () => {
        expect(result.stderr).toContain('memory would fade');
      });

      then('the full Edit-path nudge matches snapshot', () => {
        // case4b is a block path — lock its full user-faced nudge too, so the
        // Edit branch cannot regress its output undetected (exhaustiveness:
        // every block path snapped, not just Write + Bash)
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case4c] a Bash read (cat) of a memory path', () => {
    when('[t0] the guard runs', () => {
      // a READ of native memory is harmless — only writes must halt. prove the
      // read-vs-write distinction end-to-end, not just at the verdict layer
      const result = runGuard({
        tool_name: 'Bash',
        tool_input: {
          command: 'cat /home/agent/.claude/projects/x/memory/MEMORY.md',
        },
      });

      then('it allows with exit code 0', () => {
        expect(result.exitCode).toEqual(0);
      });

      then('the allow variant matches snapshot (silent, no stderr)', () => {
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case5] empty stdin (harness hiccup)', () => {
    when('[t0] the guard runs', () => {
      const result = runGuardRaw('');

      then('it fails open with exit code 0 (does not crash)', () => {
        expect(result.exitCode).toEqual(0);
      });

      then('the fail-open variant matches snapshot (silent, no stderr)', () => {
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case6] malformed json stdin', () => {
    when('[t0] the guard runs', () => {
      const result = runGuardRaw('{ not json');

      then('it fails open with exit code 0 (does not crash)', () => {
        expect(result.exitCode).toEqual(0);
      });

      then('the fail-open variant matches snapshot (silent, no stderr)', () => {
        expect(result).toMatchSnapshot();
      });
    });
  });
});
