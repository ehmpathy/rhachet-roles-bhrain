import { getMemoryGuardVerdict } from './getMemoryGuardVerdict';

/**
 * .what = data-driven cases for the memory guard verdict
 * .why = a transformer is best verified via a case table (positive + negative)
 */
const TEST_CASES: Array<{
  description: string;
  given: {
    toolName: string;
    toolInput: { file_path?: string; command?: string };
  };
  expect: 'allowed' | 'blocked';
}> = [
  // --- blocked: writes to native memory ---
  {
    description: 'blocks Write to the auto-memory MEMORY.md index',
    given: {
      toolName: 'Write',
      toolInput: {
        file_path:
          '/home/agent/.claude/projects/-home-agent-repo/memory/MEMORY.md',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks Write to a file inside the memory dir',
    given: {
      toolName: 'Write',
      toolInput: {
        file_path: '/home/agent/.claude/projects/slug/memory/user_role.md',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks Edit to a native-memory file',
    given: {
      toolName: 'Edit',
      toolInput: {
        file_path: '/home/x/.claude/sub/dir/memory/note.md',
      },
    },
    expect: 'blocked',
  },
  {
    description:
      'blocks Write to a MEMORY.md NOT under a memory dir (isolates the MEMORY.md pattern branch)',
    given: {
      toolName: 'Write',
      toolInput: { file_path: '/home/agent/.claude/projects/x/MEMORY.md' },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks Bash redirect into a memory path',
    given: {
      toolName: 'Bash',
      toolInput: {
        command:
          'echo "lesson" > /home/agent/.claude/projects/x/memory/note.md',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks Bash teesafe into a memory path',
    given: {
      toolName: 'Bash',
      toolInput: {
        command:
          'echo "lesson" | rhx teesafe /home/agent/.claude/projects/x/memory/MEMORY.md',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks Bash cp into a memory path',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'cp note.md /home/agent/.claude/projects/x/memory/note.md',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks Bash mv into a memory path',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'mv note.md /home/agent/.claude/projects/x/memory/note.md',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks Bash plain tee into a memory path',
    given: {
      toolName: 'Bash',
      toolInput: {
        command:
          'echo "lesson" | tee /home/agent/.claude/projects/x/memory/note.md',
      },
    },
    expect: 'blocked',
  },

  // --- allowed: config and durable files under ~/.claude ---
  {
    description: 'allows Write to ~/.claude/settings.json (config, not memory)',
    given: {
      toolName: 'Write',
      toolInput: { file_path: '/home/agent/.claude/settings.json' },
    },
    expect: 'allowed',
  },
  {
    description: 'allows Write to ~/.claude/CLAUDE.md (already durable)',
    given: {
      toolName: 'Write',
      toolInput: { file_path: '/home/agent/.claude/CLAUDE.md' },
    },
    expect: 'allowed',
  },
  {
    description: 'allows Write to an in-repo CLAUDE.md',
    given: {
      toolName: 'Write',
      toolInput: { file_path: '/home/agent/git/repo/CLAUDE.md' },
    },
    expect: 'allowed',
  },

  // --- allowed: the durable target itself ---
  {
    description: 'allows Write to the durable .agent brief target',
    given: {
      toolName: 'Write',
      toolInput: {
        file_path: '.agent/repo=.this/role=any/briefs/lesson.foo.md',
      },
    },
    expect: 'allowed',
  },

  // --- allowed: reads never blocked ---
  {
    description: 'allows Bash read (cat) of a memory file',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'cat /home/agent/.claude/projects/x/memory/MEMORY.md',
      },
    },
    expect: 'allowed',
  },

  // --- allowed: write-intent into a NON-memory path (precision / no over-block) ---
  {
    description: 'allows Bash write (tee) into ~/.claude config, not memory',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'echo "cfg" | tee /home/agent/.claude/settings.json',
      },
    },
    expect: 'allowed',
  },
  {
    description: 'allows Bash redirect write to a non-.claude path',
    given: {
      toolName: 'Bash',
      toolInput: { command: 'echo "x" > /tmp/scratch.txt' },
    },
    expect: 'allowed',
  },

  // --- allowed: unrelated writes ---
  {
    description: 'allows Write to an unrelated repo file',
    given: {
      toolName: 'Write',
      toolInput: { file_path: 'src/domain.operations/memory/foo.ts' },
    },
    expect: 'allowed',
  },
  {
    description: 'allows a directory named memory that is not under .claude',
    given: {
      toolName: 'Write',
      toolInput: { file_path: 'src/memory/getFoo.ts' },
    },
    expect: 'allowed',
  },
  {
    description: 'allows a Write with an absent file_path (no path to check)',
    given: {
      toolName: 'Write',
      toolInput: {},
    },
    expect: 'allowed',
  },
];

describe('getMemoryGuardVerdict', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      // map the loose case shape → the strict internal contract (string | null)
      const result = getMemoryGuardVerdict({
        toolName: thisCase.given.toolName,
        toolInput: {
          file_path: thisCase.given.toolInput.file_path ?? null,
          command: thisCase.given.toolInput.command ?? null,
        },
      });
      expect(result.verdict).toEqual(thisCase.expect);
    }),
  );

  test('blocked verdict carries reason + path (with snapshot)', () => {
    const result = getMemoryGuardVerdict({
      toolName: 'Write',
      toolInput: {
        file_path: '/home/agent/.claude/projects/x/memory/MEMORY.md',
        command: null,
      },
    });

    // narrow the discriminated union before the blocked-only fields are read
    if (result.verdict !== 'blocked')
      throw new Error('expected a blocked verdict');

    // explicit assertions for functional verification
    expect(result.reason).toContain('memory/MEMORY.md');
    expect(result.path).toEqual(
      '/home/agent/.claude/projects/x/memory/MEMORY.md',
    );

    // snapshot locks the full blocked-verdict shape for review-diff visibility
    expect(result).toMatchSnapshot();
  });

  test('allowed verdict shape (with snapshot)', () => {
    const result = getMemoryGuardVerdict({
      toolName: 'Write',
      toolInput: {
        file_path: '/home/agent/.claude/settings.json',
        command: null,
      },
    });

    // explicit assertion for functional verification
    expect(result.verdict).toEqual('allowed');

    // snapshot locks the allowed-verdict shape too — the other output variant of
    // this contract, so a drift (e.g. an accidental extra field) surfaces in review
    expect(result).toMatchSnapshot();
  });
});
