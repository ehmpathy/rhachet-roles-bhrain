import { getOneClaudePathAssigned } from './getOneClaudePathAssigned';

const TEST_CASES: Array<{
  description: string;
  command: string;
  expect: string | null;
}> = [
  {
    description: 'a bare assignment under .claude/',
    command: 'D=~/.claude/projects/p; echo x > $D/memory/a.md',
    expect: '~/.claude/projects/p',
  },
  {
    description: 'a quoted assignment under .claude/',
    command: 'D="$HOME/.claude/projects/p"; echo x > "$D/memory/a.md"',
    expect: '$HOME/.claude/projects/p',
  },
  {
    description: 'an exported assignment under .claude/',
    command: 'export D=/home/a/.claude/projects/p && cd $D',
    expect: '/home/a/.claude/projects/p',
  },
  {
    description: 'a .claude/ path read as an arg is no assignment',
    command: 'jq . ~/.claude/settings.json > $OUT',
    expect: null,
  },
  {
    description: 'an assignment outside .claude/',
    command: 'D=/tmp/x; echo x > $D/a.md',
    expect: null,
  },
];

describe('getOneClaudePathAssigned', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneClaudePathAssigned({ command: thisCase.command })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
