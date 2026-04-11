import { given, then, useThen, when } from 'test-fns';

import {
  genTempDirForGoals,
  invokeGoalGuard,
  sanitizeGoalOutputForSnapshot,
} from './.test/invokeGoalSkill';

/**
 * .what = acceptance tests for goal.guard PreToolUse hook
 * .why = verifies direct .goals/ access is blocked with correct output
 */
describe('achiever.goal.guard.acceptance', () => {
  given('[case1] Read tool with .goals/ path', () => {
    const scene = { tempDir: genTempDirForGoals({ slug: 'goal-guard-read' }) };

    when('[t0] path is .goals/branch/file.yaml', () => {
      const result = useThen('invoke goal.guard', async () => {
        return invokeGoalGuard({
          toolName: 'Read',
          toolInput: { file_path: '.goals/branch/file.yaml' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains blocked message', () => {
        expect(result.stderr).toContain('blocked');
        expect(result.stderr).toContain('.goals/');
      });

      then('stderr has owl wisdom', () => {
        expect(result.stderr).toContain('patience, friend');
      });

      then('stderr lists allowed skills', () => {
        expect(result.stderr).toContain('goal.memory.set');
        expect(result.stderr).toContain('goal.memory.get');
        expect(result.stderr).toContain('goal.infer.triage');
        expect(result.stderr).toContain('goal.triage.next');
      });

      then('stderr matches snapshot', () => {
        expect(sanitizeGoalOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case2] Write tool with .goals/ path', () => {
    const scene = { tempDir: genTempDirForGoals({ slug: 'goal-guard-write' }) };

    when('[t0] path is .goals/branch/file.yaml', () => {
      const result = useThen('invoke goal.guard', async () => {
        return invokeGoalGuard({
          toolName: 'Write',
          toolInput: { file_path: '.goals/branch/file.yaml' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains blocked message', () => {
        expect(result.stderr).toContain('blocked');
      });
    });
  });

  given('[case3] Edit tool with .goals/ path', () => {
    const scene = { tempDir: genTempDirForGoals({ slug: 'goal-guard-edit' }) };

    when('[t0] path is .goals/branch/file.yaml', () => {
      const result = useThen('invoke goal.guard', async () => {
        return invokeGoalGuard({
          toolName: 'Edit',
          toolInput: { file_path: '.goals/branch/file.yaml' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains blocked message', () => {
        expect(result.stderr).toContain('blocked');
      });
    });
  });

  given('[case4] Bash tool with rm command on .goals/', () => {
    const scene = { tempDir: genTempDirForGoals({ slug: 'goal-guard-bash-rm' }) };

    when('[t0] command is rm -rf .goals/', () => {
      const result = useThen('invoke goal.guard', async () => {
        return invokeGoalGuard({
          toolName: 'Bash',
          toolInput: { command: 'rm -rf .goals/' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains blocked message', () => {
        expect(result.stderr).toContain('blocked');
        expect(result.stderr).toContain('.goals/');
      });
    });
  });

  given('[case5] Bash tool with cat command on .goals/', () => {
    const scene = { tempDir: genTempDirForGoals({ slug: 'goal-guard-bash-cat' }) };

    when('[t0] command is cat .goals/branch/file.yaml', () => {
      const result = useThen('invoke goal.guard', async () => {
        return invokeGoalGuard({
          toolName: 'Bash',
          toolInput: { command: 'cat .goals/branch/file.yaml' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains blocked message', () => {
        expect(result.stderr).toContain('blocked');
      });
    });
  });

  given('[case6] Bash tool with mv command on .goals/', () => {
    const scene = { tempDir: genTempDirForGoals({ slug: 'goal-guard-bash-mv' }) };

    when('[t0] command is mv .goals/ .goals.bak', () => {
      const result = useThen('invoke goal.guard', async () => {
        return invokeGoalGuard({
          toolName: 'Bash',
          toolInput: { command: 'mv .goals/ .goals.bak' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains blocked message', () => {
        expect(result.stderr).toContain('blocked');
      });
    });
  });

  given('[case7] safe path that does not contain .goals/', () => {
    const scene = { tempDir: genTempDirForGoals({ slug: 'goal-guard-safe' }) };

    when('[t0] path is src/index.ts', () => {
      const result = useThen('invoke goal.guard', async () => {
        return invokeGoalGuard({
          toolName: 'Read',
          toolInput: { file_path: 'src/index.ts' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stderr is empty', () => {
        expect(result.stderr).toEqual('');
      });

      then('stdout is empty', () => {
        expect(result.stdout).toEqual('');
      });
    });
  });

  given('[case8] .goals-archive path (similar name, different dir)', () => {
    const scene = { tempDir: genTempDirForGoals({ slug: 'goal-guard-archive' }) };

    when('[t0] path is .goals-archive/old.yaml', () => {
      const result = useThen('invoke goal.guard', async () => {
        return invokeGoalGuard({
          toolName: 'Read',
          toolInput: { file_path: '.goals-archive/old.yaml' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0 (not a false positive)', () => {
        expect(result.code).toEqual(0);
      });

      then('operation is allowed', () => {
        expect(result.stderr).toEqual('');
      });
    });
  });

  given('[case9] route-scoped .goals path (nested in route dir)', () => {
    const scene = { tempDir: genTempDirForGoals({ slug: 'goal-guard-route' }) };

    when('[t0] path is .behavior/route/.goals/file.yaml', () => {
      const result = useThen('invoke goal.guard', async () => {
        return invokeGoalGuard({
          toolName: 'Read',
          toolInput: { file_path: '.behavior/route/.goals/file.yaml' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains blocked message', () => {
        expect(result.stderr).toContain('blocked');
        expect(result.stderr).toContain('.goals/');
      });
    });
  });

  given('[case10] Bash tool with safe command', () => {
    const scene = { tempDir: genTempDirForGoals({ slug: 'goal-guard-bash-safe' }) };

    when('[t0] command does not reference .goals/', () => {
      const result = useThen('invoke goal.guard', async () => {
        return invokeGoalGuard({
          toolName: 'Bash',
          toolInput: { command: 'ls -la src/' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('operation is allowed', () => {
        expect(result.stderr).toEqual('');
      });
    });
  });
});
