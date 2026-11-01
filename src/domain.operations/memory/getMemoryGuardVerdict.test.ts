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
    cwd?: string;
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
    // a deliberate over-block: copy verbs are graded blunt, by any memory-path arg
    description: 'blocks Bash cp OUT of a memory path too (blunt copy verbs)',
    given: {
      toolName: 'Bash',
      toolInput: {
        command:
          'cp /home/agent/.claude/projects/x/memory/note.md /tmp/note.md',
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

  // --- [caseE] allowed: a read that holds a `>` token which writes no file ---
  {
    description: '[caseE] allows a memory read with `2>&1` (fd duplicate)',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'grep x /home/agent/.claude/projects/p/memory/a.md 2>&1',
      },
    },
    expect: 'allowed',
  },
  {
    description: '[caseE] allows a memory read with `>&2` (fd duplicate)',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'cat /home/agent/.claude/projects/p/memory/a.md >&2',
      },
    },
    expect: 'allowed',
  },
  {
    description:
      '[caseE] allows a memory read with a `=>` arrow in the pattern',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: "grep '=>' /home/agent/.claude/projects/p/memory/a.md",
      },
    },
    expect: 'allowed',
  },
  {
    description:
      '[caseE] allows a memory read with a `->` arrow in the pattern',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: "grep -- '->' /home/agent/.claude/projects/p/memory/a.md",
      },
    },
    expect: 'allowed',
  },
  {
    description:
      'allows a memory read whose redirect lands at an absolute path outside memory',
    given: {
      toolName: 'Bash',
      toolInput: {
        command:
          'cat /home/agent/.claude/projects/p/memory/a.md > /tmp/out.txt',
      },
    },
    expect: 'allowed',
  },
  {
    // tee writes only its operands, so it is graded by where they land
    description: 'allows a memory read piped to tee outside memory',
    given: {
      toolName: 'Bash',
      toolInput: {
        command:
          'cat /home/agent/.claude/projects/p/memory/a.md | tee /tmp/out.md',
      },
    },
    expect: 'allowed',
  },
  {
    description: 'allows a memory read piped to tee into a durable brief',
    given: {
      toolName: 'Bash',
      toolInput: {
        command:
          'cat ~/.claude/projects/p/memory/a.md | tee .agent/repo=.this/role=any/briefs/b.md',
      },
      cwd: '/home/agent/repo',
    },
    expect: 'allowed',
  },
  ...[
    'ls ~/.claude/projects/p/memory | xargs tee',
    'find ~/.claude/projects/p/memory -exec tee {} \\;',
    'cat ~/.claude/projects/p/memory/a.md | tee $F',
    'cat ~/.claude/projects/p/memory/a.md | tee out.md',
    'cat x.md | tee -a ~/.claude/projects/p/memory/a.md',
  ].map((command) => ({
    description: `blocks a tee whose operands may land in memory: ${command}`,
    given: { toolName: 'Bash', toolInput: { command } },
    expect: 'blocked' as const,
  })),
  ...[
    'echo x | tee a.md 2>/dev/null ~/.claude/projects/p/memory/x.md',
    'echo x | tee a.md >/dev/null ~/.claude/projects/p/memory/x.md',
    'echo x | tee /tmp/a 2>&1 ~/.claude/projects/p/memory/x.md',
  ].map((command) => ({
    description: `blocks a tee operand past a redirect: ${command}`,
    given: {
      toolName: 'Bash',
      toolInput: { command },
      cwd: '/home/agent/repo',
    },
    expect: 'blocked' as const,
  })),
  ...[
    'cat ~/.claude/projects/p/memory/a.md | /usr/bin/tee /tmp/out.md',
    'cat ~/.claude/projects/p/memory/a.md | \\tee /tmp/out.md',
  ].map((command) => ({
    description: `allows a path-named or escaped tee outside memory: ${command}`,
    given: { toolName: 'Bash', toolInput: { command } },
    expect: 'allowed' as const,
  })),

  // --- blocked: a cwd moved inside a command string the fold cannot follow ---
  ...[
    "bash -c 'cd ~/.claude/projects/p/memory; echo x > a.md'",
    'sh -c "cd ~/.claude/projects/p/memory && printf x > a.md"',
    'eval "cd ~/.claude/projects/p/memory; echo x > a.md"',
  ].map((command) => ({
    description: `blocks a write after a cd inside a command string: ${command}`,
    given: {
      toolName: 'Bash',
      toolInput: { command },
      cwd: '/home/agent/repo',
    },
    expect: 'blocked' as const,
  })),

  // --- blocked: a cd whose lead word is escaped or quoted still moves the cwd ---
  ...[
    '\\cd ~/.claude/projects/p/memory; echo x > a.md',
    "'cd' ~/.claude/projects/p/memory; echo x > a.md",
    '"cd" ~/.claude/projects/p/memory && echo x > a.md',
    '\\pushd ~/.claude/projects/p/memory; echo x > a.md',
  ].map((command) => ({
    description: `blocks a write after an escaped or quoted cd: ${command}`,
    given: {
      toolName: 'Bash',
      toolInput: { command },
      cwd: '/home/agent/repo',
    },
    expect: 'blocked' as const,
  })),
  {
    description: 'allows a memory read redirected to an absolute path outside',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'cat /home/agent/.claude/projects/p/memory/a.md > /tmp/out.md',
      },
    },
    expect: 'allowed',
  },
  {
    description: 'allows a grep whose pattern is a copy verb',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'grep -c tee /home/agent/.claude/projects/p/memory/a.md',
      },
    },
    expect: 'allowed',
  },
  {
    // a copy verb in a command that names memory is graded beside it; the read
    // route is two calls (fulcrum F10)
    description: 'blocks a memory read chained after an mv',
    given: {
      toolName: 'Bash',
      toolInput: {
        command:
          'mv a.md b.md && cat /home/agent/.claude/projects/p/memory/a.md',
      },
    },
    expect: 'blocked',
  },

  // --- blocked: a write the guard cannot place, beside memory (graded blunt) ---
  {
    description: 'blocks a redirect to a relative path beside a memory path',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'cat /home/agent/.claude/projects/p/memory/a.md > out.txt',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks a redirect through a var set to a memory dir',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'D=/home/agent/.claude/projects/p/memory/; echo x > $D/a.md',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks a relative redirect after a cd into memory',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'cd /home/agent/.claude/projects/p/memory/ && echo x > a.md',
      },
    },
    expect: 'blocked',
  },

  // --- blocked: a true redirect write survives the look-alike tokens ---
  {
    description: 'blocks a redirect into memory with a trailer `2>&1`',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'echo x > /home/agent/.claude/projects/p/memory/x.md 2>&1',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks a redirect into memory whose echoed text holds `=>`',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: "echo '=>' > /home/agent/.claude/projects/p/memory/x.md",
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks a `>>` append into memory',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'echo x >> ~/.claude/projects/p/memory/MEMORY.md',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks a `>|` (noclobber override) into memory',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'echo x >| ~/.claude/projects/p/memory/x.md',
      },
    },
    expect: 'blocked',
  },
  {
    description:
      'blocks a redirect into a quoted memory path with a space in it',
    given: {
      toolName: 'Bash',
      toolInput: {
        command:
          'echo x > "/Users/me/My Project/.claude/projects/p/memory/a.md"',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks a quoted var joined to a memory path',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'echo x > "$HOME"/.claude/projects/p/memory/x.md',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks a `>&` that sends both streams into memory',
    given: {
      toolName: 'Bash',
      toolInput: { command: 'echo x >& ~/.claude/projects/p/memory/x.md' },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks an absolute /bin/cp into memory',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: '/bin/cp note.md ~/.claude/projects/p/memory/x.md',
      },
    },
    expect: 'blocked',
  },
  {
    description: 'blocks an escaped \\cp into memory',
    given: {
      toolName: 'Bash',
      toolInput: { command: '\\cp note.md ~/.claude/projects/p/memory/x.md' },
    },
    expect: 'blocked',
  },
  {
    description:
      'allows a cat read of a memory path whose project slug holds a copy verb',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'cat ~/.claude/projects/-home-me-cp-tools/memory/a.md',
      },
    },
    expect: 'allowed',
  },

  // --- blocked: a copy verb behind a wrapper the guard has no name for ---
  ...[
    'for f in *.md; do cp $f ~/.claude/projects/p/memory/; done',
    'if true; then cp a.md ~/.claude/projects/p/memory/x.md; fi',
    '{ cp a.md ~/.claude/projects/p/memory/x.md; }',
    '! cp a.md ~/.claude/projects/p/memory/x.md',
    'bash -c "cp a.md ~/.claude/projects/p/memory/x.md"',
    "sh -c 'cp a.md ~/.claude/projects/p/memory/x.md'",
    'sudo -u root cp a.md ~/.claude/projects/p/memory/x.md',
    'nice -n 5 cp a.md ~/.claude/projects/p/memory/x.md',
    'time -p cp a.md ~/.claude/projects/p/memory/x.md',
    'timeout 5 tee ~/.claude/projects/p/memory/x.md',
    'nohup cp a.md ~/.claude/projects/p/memory/x.md',
    'ls | xargs -I{} cp {} ~/.claude/projects/p/memory/',
    'find . -exec cp {} ~/.claude/projects/p/memory/ \\;',
    'echo $(cp a.md ~/.claude/projects/p/memory/x.md)',
    'git -C ~/.claude/projects/p/memory mv a.md b.md',
    'cp "a;b.md" ~/.claude/projects/p/memory/x.md',
  ].map((command) => ({
    description: `blocks a copy verb behind a wrapper: ${command}`,
    given: { toolName: 'Bash', toolInput: { command } },
    expect: 'blocked' as const,
  })),

  // --- blocked: a copy verb whose memory path an earlier command set ---
  ...[
    'cd ~/.claude/projects/p/memory && cp ../x.md a.md',
    'cd ~/.claude/projects/p/memory && tee a.md',
    'D=~/.claude/projects/p/memory; cp x.md $D/a.md',
    'D=~/.claude/projects/p/memory; echo x | tee $D/a.md',
  ].map((command) => ({
    description: `blocks a copy verb through an anchor: ${command}`,
    given: { toolName: 'Bash', toolInput: { command } },
    expect: 'blocked' as const,
  })),

  // --- blocked: a writer a reader would mask, were the split to miss a cut ---
  ...[
    'echo hi & cp a.md ~/.claude/projects/p/memory/x.md',
    'ls & cp a.md ~/.claude/projects/p/memory/x.md',
    'echo \\"; cp a.md ~/.claude/projects/p/memory/x.md; echo \\"',
    "echo $'a\\'b'; cp a.md ~/.claude/projects/p/memory/x.md",
    'cat <(cp a.md ~/.claude/projects/p/memory/x.md)',
    'echo "$(cp a.md ~/.claude/projects/p/memory/x.md)"',
    'echo hi; cp a.md ~/.claude/projects/p/memory/x.md', // the control
  ].map((command) => ({
    description: `blocks a writer beside a reader: ${command}`,
    given: { toolName: 'Bash', toolInput: { command } },
    expect: 'blocked' as const,
  })),

  // --- blocked: a write into memory through a cwd folded across cd moves ---
  ...[
    'cd ~/.claude/projects/p; cd memory; tee a.md',
    '(cd ~/.claude/projects/p/memory && echo x > a.md)',
    '{ cd ~/.claude/projects/p/memory; echo x > a.md; }',
    'cd ~/.claude/projects/p/memory && cat a.md > out.txt',
  ].map((command) => ({
    description: `blocks a write through a folded cwd: ${command}`,
    given: {
      toolName: 'Bash',
      toolInput: { command },
      cwd: '/home/agent/repo',
    },
    expect: 'blocked' as const,
  })),
  {
    description: 'allows a read redirected after a cd outside memory',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'cd /tmp && cat ~/.claude/projects/p/memory/a.md > out.txt',
      },
      cwd: '/home/agent/repo',
    },
    expect: 'allowed',
  },

  // --- blocked: a writer whose memory path a loop, a read, or a pipe carries in ---
  ...[
    'for f in ~/.claude/projects/p/memory/*.md; do cp a.md "$f"; done',
    'ls ~/.claude/projects/p/memory | xargs cp a.md',
    'while read f; do echo x > "$f"; done < ~/.claude/projects/p/memory/list',
    'find ~/.claude/projects/p/memory | while read f; do echo x > "$f"; done',
  ].map((command) => ({
    description: `blocks a writer the command carries memory into: ${command}`,
    given: {
      toolName: 'Bash',
      toolInput: { command },
      cwd: '/home/agent/repo',
    },
    expect: 'blocked' as const,
  })),

  // --- blocked: a memory path built from a var set under `.claude/` ---
  ...[
    'D=~/.claude/projects/p; echo x > $D/memory/a.md',
    'D=~/.claude/projects/p; cd $D/memory; echo x > a.md',
    'D="$HOME/.claude/projects/p"; echo x > "$D/memory/a.md"',
  ].map((command) => ({
    description: `blocks a write through a var set under .claude/: ${command}`,
    given: {
      toolName: 'Bash',
      toolInput: { command },
      cwd: '/home/agent/repo',
    },
    expect: 'blocked' as const,
  })),
  ...['D=/tmp/x; echo x > $D/a.md', 'jq . ~/.claude/settings.json > $OUT'].map(
    (command) => ({
      description: `allows a var redirect with no var set under .claude/: ${command}`,
      given: {
        toolName: 'Bash',
        toolInput: { command },
        cwd: '/home/agent/repo',
      },
      expect: 'allowed' as const,
    }),
  ),

  // --- blocked: a cwd the fold cannot pin to one place, beside memory ---
  ...[
    'cd -P ~/.claude/projects/p/memory; echo x > a.md',
    'cd -- ~/.claude/projects/p/memory; echo x > a.md',
    'cd $HOME/.claude/projects/p/memory; echo x > a.md',
    'cd ~/.claude/projects/p/memory || cd /tmp; echo x > a.md',
    '(cd /tmp) ; cd ~/.claude/projects/p/memory; cd /tmp; echo x > a.md',
  ].map((command) => ({
    description: `blocks a write at a cwd the fold cannot pin: ${command}`,
    given: {
      toolName: 'Bash',
      toolInput: { command },
      cwd: '/home/agent/repo',
    },
    expect: 'blocked' as const,
  })),

  // --- allowed: a `>` beside a memory read, landed outside memory ---
  ...[
    'cat ~/.claude/projects/p/memory/a.md; echo done > /tmp/log.txt',
    'npm test > out.log 2>&1 && cat ~/.claude/projects/p/memory/a.md',
    'cat ~/.claude/projects/p/memory/a.md | grep x > hits.txt',
  ].map((command) => ({
    description: `allows a read beside a redirect elsewhere: ${command}`,
    given: {
      toolName: 'Bash',
      toolInput: { command },
      cwd: '/home/agent/repo',
    },
    expect: 'allowed' as const,
  })),
  {
    description:
      'blocks a relative redirect beside a memory read when no cwd is known',
    given: {
      toolName: 'Bash',
      toolInput: {
        command:
          'npm test > out.log 2>&1 && cat ~/.claude/projects/p/memory/a.md',
      },
    },
    expect: 'blocked',
  },

  // --- the harness cwd: a relative redirect graded at the place it lands ---
  {
    description:
      'allows a memory read redirected to a relative path, cwd known',
    given: {
      toolName: 'Bash',
      toolInput: { command: 'cat ~/.claude/projects/p/memory/a.md > out.txt' },
      cwd: '/home/agent/repo',
    },
    expect: 'allowed',
  },
  {
    description: 'allows an awk comparator `>` beside memory, cwd known',
    given: {
      toolName: 'Bash',
      toolInput: { command: "awk '$1 > 5' ~/.claude/projects/p/memory/a.md" },
      cwd: '/home/agent/repo',
    },
    expect: 'allowed',
  },
  {
    description: 'blocks a relative redirect when the cwd is memory',
    given: {
      toolName: 'Bash',
      toolInput: { command: 'echo x > a.md' },
      cwd: '/home/agent/.claude/projects/p/memory',
    },
    expect: 'blocked',
  },
  {
    description: 'blocks a relative redirect after a cd into memory, cwd known',
    given: {
      toolName: 'Bash',
      toolInput: {
        command: 'cd ~/.claude/projects/p/memory && echo x > a.md',
      },
      cwd: '/home/agent/repo',
    },
    expect: 'blocked',
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
        cwd: thisCase.given.cwd ?? null,
      });
      expect(result.verdict).toEqual(thisCase.expect);
    }),
  );

  test('blocked verdict carries path + act (with snapshot)', () => {
    const result = getMemoryGuardVerdict({
      toolName: 'Write',
      toolInput: {
        file_path: '/home/agent/.claude/projects/x/memory/MEMORY.md',
        command: null,
      },
      cwd: null,
    });

    // explicit assertion over the whole blocked shape, so no union narrow is owed
    expect(result).toEqual({
      verdict: 'blocked',
      path: '/home/agent/.claude/projects/x/memory/MEMORY.md',
      act: 'write',
    });

    // snapshot locks the full blocked-verdict shape for review-diff visibility
    expect(result).toMatchSnapshot();
  });

  test('blocked verdict of a copy verb names the copy, not a write', () => {
    const result = getMemoryGuardVerdict({
      toolName: 'Bash',
      toolInput: {
        command:
          'cp /home/agent/.claude/projects/x/memory/note.md /tmp/note.md',
        file_path: null,
      },
      cwd: null,
    });

    // a copy OUT of memory is a read the blunt grade blocks; the act says so
    expect(result).toEqual({
      verdict: 'blocked',
      path: '/home/agent/.claude/projects/x/memory/note.md',
      act: 'copy',
    });
    expect(result).toMatchSnapshot();
  });

  test('blocked verdict of a tee or teesafe names a write, never a copy', () => {
    const results = [
      'echo x | tee /home/agent/.claude/projects/x/memory/note.md',
      'echo x | rhx teesafe /home/agent/.claude/projects/x/memory/note.md',
    ].map((command) =>
      getMemoryGuardVerdict({
        toolName: 'Bash',
        toolInput: { command, file_path: null },
        cwd: null,
      }),
    );

    // every tee operand is a target, so the act is a plain write
    expect(results).toEqual([
      {
        verdict: 'blocked',
        path: '/home/agent/.claude/projects/x/memory/note.md',
        act: 'write',
      },
      {
        verdict: 'blocked',
        path: '/home/agent/.claude/projects/x/memory/note.md',
        act: 'write',
      },
    ]);
  });

  test('a cp or mv into memory with a redirect word after it names a write', () => {
    const M = '/home/agent/.claude/projects/x/memory/note.md';
    const results = [
      `cp note.md ${M} 2>&1`,
      `mv note.md ${M} 2>&1`,
      `cp note.md ${M} 2>/dev/null`,
      `cp -v note.md ${M} >/dev/null`,
      `cp note.md ${M} > /tmp/log`,
    ].map((command) =>
      getMemoryGuardVerdict({
        toolName: 'Bash',
        toolInput: { command, file_path: null },
        cwd: '/repo',
      }),
    );

    // a redirect word is no destination; the copy lands in memory, so it writes
    expect(results).toEqual(
      results.map(() => ({ verdict: 'blocked', path: M, act: 'write' })),
    );
  });

  test('a cp or mv whose destination is memory names a write; out of it, a copy', () => {
    const results = [
      'cp note.md /home/agent/.claude/projects/x/memory/note.md',
      'mv note.md "/home/agent/.claude/projects/x/memory/note.md"',
      'mv /home/agent/.claude/projects/x/memory/note.md /tmp/note.md',
      'cd /home/agent/.claude/projects/x/memory && cp ../a.md b.md',
      'cp -t /home/agent/.claude/projects/x/memory a.md b.md',
      'D=/home/agent/.claude/projects/x/memory; echo x > $D/a.md',
    ].map((command) =>
      getMemoryGuardVerdict({
        toolName: 'Bash',
        toolInput: { command, file_path: null },
        cwd: null,
      }),
    );

    // the destination (after -t, else last) decides write vs copy; a $var target
    // the guard cannot place is its own act
    expect(results.map((result) => 'act' in result && result.act)).toEqual([
      'write',
      'write',
      'copy',
      'copy',
      'write',
      'unplaced',
    ]);
    expect(results).toMatchSnapshot();
  });

  test('a large command is graded well inside the hook budget', () => {
    // the hook has 5s, and node cannot interrupt a synchronous verdict; a parse
    // that is quadratic in the command length stalls an ordinary brief write
    const heredoc = [
      "cat > brief.md <<'EOF'",
      ...Array.from(
        { length: 1600 },
        (_, index) => `line ${index}: "cp" it; a | b & c > d`,
      ),
      'EOF',
    ].join('\n');
    const word = `echo ${'a'.repeat(100_000)}`;
    const cds = Array.from(
      { length: 40 },
      (_, index) => `cd d${index} && make`,
    ).join(' && ');
    [heredoc, word, cds].forEach((command) => {
      const before = Date.now();
      getMemoryGuardVerdict({
        toolName: 'Bash',
        toolInput: { command, file_path: null },
        cwd: '/home/agent/repo',
      });
      // 1.5s holds under a loaded test host and well inside the 5s budget; each
      // quadratic or exponential parse this clamps ran 200s+
      expect(Date.now() - before).toBeLessThan(1500);
    });
    expect(heredoc.length).toBeGreaterThan(50_000);
    expect(word.length).toBeGreaterThan(50_000);
  });

  test('a cwd past the tracked cap reads as unknown, so a write beside memory blocks', () => {
    const cds = Array.from({ length: 20 }, (_, index) => `cd d${index}`).join(
      ' || ',
    );
    const result = getMemoryGuardVerdict({
      toolName: 'Bash',
      toolInput: {
        command: `${cds}; cat ~/.claude/projects/p/memory/a.md > out.txt`,
        file_path: null,
      },
      cwd: '/home/agent/repo',
    });
    expect(result).toEqual({
      verdict: 'blocked',
      path: '~/.claude/projects/p/memory/a.md',
      act: 'unplaced',
    });
    expect(result).toMatchSnapshot();
  });

  test('allowed verdict shape (with snapshot)', () => {
    const result = getMemoryGuardVerdict({
      toolName: 'Write',
      toolInput: {
        file_path: '/home/agent/.claude/settings.json',
        command: null,
      },
      cwd: null,
    });

    // explicit assertion for functional verification
    expect(result.verdict).toEqual('allowed');

    // snapshot locks the allowed-verdict shape too — the other output variant of
    // this contract, so a drift (e.g. an accidental extra field) surfaces in review
    expect(result).toMatchSnapshot();
  });
});
