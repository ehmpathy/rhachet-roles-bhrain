import { given, then, when } from 'test-fns';

import { getGoalGuardVerdict } from './getGoalGuardVerdict';

describe('getGoalGuardVerdict', () => {
  given('[case1] Read tool with .goals/ path', () => {
    when('[t0] path is .goals/branch/file.yaml', () => {
      then('verdict is blocked', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Read',
          toolInput: { file_path: '.goals/branch/file.yaml' },
        });
        expect(result.verdict).toEqual('blocked');
        expect(result.reason).toContain('.goals/');
      });
    });
  });

  given('[case2] Write tool with .goals/ path', () => {
    when('[t0] path is .goals/branch/file.yaml', () => {
      then('verdict is blocked', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Write',
          toolInput: { file_path: '.goals/branch/file.yaml' },
        });
        expect(result.verdict).toEqual('blocked');
      });
    });
  });

  given('[case3] Edit tool with .goals/ path', () => {
    when('[t0] path is .goals/branch/file.yaml', () => {
      then('verdict is blocked', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Edit',
          toolInput: { file_path: '.goals/branch/file.yaml' },
        });
        expect(result.verdict).toEqual('blocked');
      });
    });
  });

  given('[case4] Bash tool with rm command on .goals/', () => {
    when('[t0] command is rm -rf .goals/', () => {
      then('verdict is blocked', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Bash',
          toolInput: { command: 'rm -rf .goals/' },
        });
        expect(result.verdict).toEqual('blocked');
      });
    });
  });

  given('[case5] Bash tool with cat command on .goals/', () => {
    when('[t0] command is cat .goals/branch/file.yaml', () => {
      then('verdict is blocked', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Bash',
          toolInput: { command: 'cat .goals/branch/file.yaml' },
        });
        expect(result.verdict).toEqual('blocked');
      });
    });
  });

  given('[case6] Bash tool with mv command on .goals/', () => {
    when('[t0] command is mv .goals/ .goals.bak', () => {
      then('verdict is blocked', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Bash',
          toolInput: { command: 'mv .goals/ .goals.bak' },
        });
        expect(result.verdict).toEqual('blocked');
      });
    });
  });

  given('[case7] safe path that does not contain .goals/', () => {
    when('[t0] path is src/index.ts', () => {
      then('verdict is allowed', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Read',
          toolInput: { file_path: 'src/index.ts' },
        });
        expect(result.verdict).toEqual('allowed');
      });
    });
  });

  given('[case8] .goals-archive path (similar name, different dir)', () => {
    when('[t0] path is .goals-archive/old.yaml', () => {
      then('verdict is allowed (not a false positive)', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Read',
          toolInput: { file_path: '.goals-archive/old.yaml' },
        });
        expect(result.verdict).toEqual('allowed');
      });
    });
  });

  given('[case9] route-scoped .goals path (nested in route dir)', () => {
    when('[t0] path is .behavior/route/.goals/file.yaml', () => {
      then('verdict is blocked', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Read',
          toolInput: { file_path: '.behavior/route/.goals/file.yaml' },
        });
        expect(result.verdict).toEqual('blocked');
      });
    });
  });

  given('[case10] no file_path or command provided', () => {
    when('[t0] tool_input is empty', () => {
      then('verdict is allowed', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Read',
          toolInput: {},
        });
        expect(result.verdict).toEqual('allowed');
      });
    });
  });

  given('[case11] Bash tool with quoted path', () => {
    when('[t0] command uses double quotes', () => {
      then('verdict is blocked', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Bash',
          toolInput: { command: 'cat ".goals/branch/file.yaml"' },
        });
        expect(result.verdict).toEqual('blocked');
      });
    });

    when('[t1] command uses single quotes', () => {
      then('verdict is blocked', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Bash',
          toolInput: { command: "cat '.goals/branch/file.yaml'" },
        });
        expect(result.verdict).toEqual('blocked');
      });
    });
  });

  given('[case12] Bash tool with safe command', () => {
    when('[t0] command does not reference .goals/', () => {
      then('verdict is allowed', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Bash',
          toolInput: { command: 'ls -la src/' },
        });
        expect(result.verdict).toEqual('allowed');
      });
    });
  });

  given('[case13] exact .goals directory (no end slash)', () => {
    when('[t0] path is just .goals', () => {
      then('verdict is blocked', () => {
        const result = getGoalGuardVerdict({
          toolName: 'Read',
          toolInput: { file_path: '.goals' },
        });
        expect(result.verdict).toEqual('blocked');
      });
    });
  });
});
