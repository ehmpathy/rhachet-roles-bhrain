import { getAllBashRedirectTargets } from './getAllBashRedirectTargets';

/**
 * .what = data-driven cases for the bash redirect target parse
 * .why = the redirect grammar is the closed set the memory guard relies on; each
 *        operator and each look-alike token gets its own row
 */
const TEST_CASES: Array<{
  description: string;
  given: { command: string };
  expect: { targets: string[] };
}> = [
  // --- file redirects: captured ---
  {
    description: 'captures a plain `>` target',
    given: { command: 'echo x > out.txt' },
    expect: { targets: ['out.txt'] },
  },
  {
    description: 'captures a `>>` target',
    given: { command: 'echo x >> out.txt' },
    expect: { targets: ['out.txt'] },
  },
  {
    description: 'captures a `>|` (noclobber override) target',
    given: { command: 'echo x >| out.txt' },
    expect: { targets: ['out.txt'] },
  },
  {
    description: 'captures a target with no space after the operator',
    given: { command: 'echo x >out.txt' },
    expect: { targets: ['out.txt'] },
  },
  {
    description: 'captures an fd-prefixed `2>` target',
    given: { command: 'npm test 2> err.log' },
    expect: { targets: ['err.log'] },
  },
  {
    description: 'captures an `&>` target',
    given: { command: 'npm test &> all.log' },
    expect: { targets: ['all.log'] },
  },
  {
    description: 'captures a quoted target',
    given: { command: 'echo x > "out.txt"' },
    expect: { targets: ['out.txt'] },
  },
  {
    description: 'captures a double-quoted target whole, spaces and all',
    given: {
      command: 'echo x > "/Users/me/My Project/.claude/projects/p/memory/a.md"',
    },
    expect: {
      targets: ['/Users/me/My Project/.claude/projects/p/memory/a.md'],
    },
  },
  {
    description: 'captures a quoted span joined to a bare run as one word',
    given: { command: 'echo x > "$HOME"/.claude/projects/p/memory/x.md' },
    expect: { targets: ['$HOME/.claude/projects/p/memory/x.md'] },
  },
  {
    description: 'captures a `>&` target that names a file, not an fd',
    given: { command: 'echo x >& ~/.claude/projects/p/memory/x.md' },
    expect: { targets: ['~/.claude/projects/p/memory/x.md'] },
  },
  {
    description: 'captures a `>&` target with no space',
    given: { command: 'echo x >&out.log' },
    expect: { targets: ['out.log'] },
  },
  {
    description: 'refuses `>&-` (fd close)',
    given: { command: 'echo x >&-' },
    expect: { targets: [] },
  },
  {
    description: 'captures a single-quoted target whole, spaces and all',
    given: { command: "echo x >> '/tmp/my dir/out.txt'" },
    expect: { targets: ['/tmp/my dir/out.txt'] },
  },
  {
    description: 'captures a tilde memory path',
    given: { command: 'echo x > ~/.claude/projects/p/memory/x.md' },
    expect: { targets: ['~/.claude/projects/p/memory/x.md'] },
  },
  {
    description: 'captures the file target beside an fd duplicate',
    given: { command: 'echo x > out.txt 2>&1' },
    expect: { targets: ['out.txt'] },
  },

  // --- look-alikes: refused ---
  {
    description: 'refuses `2>&1` (fd duplicate)',
    given: { command: 'npm test 2>&1' },
    expect: { targets: [] },
  },
  {
    description: 'refuses `>&2` (fd duplicate)',
    given: { command: 'echo oops >&2' },
    expect: { targets: [] },
  },
  {
    description: 'refuses a `=>` arrow in a quoted pattern',
    given: { command: "grep '=>' src/a.ts" },
    expect: { targets: [] },
  },
  {
    description: 'refuses a `->` arrow in a quoted pattern',
    given: { command: "grep -- '->' src/a.ts" },
    expect: { targets: [] },
  },
  {
    description: 'finds no target in a command with no `>`',
    given: { command: 'cat ~/.claude/projects/p/memory/MEMORY.md' },
    expect: { targets: [] },
  },
];

describe('getAllBashRedirectTargets', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllBashRedirectTargets(thisCase.given)).toEqual(
        thisCase.expect.targets,
      );
    }),
  );
});
