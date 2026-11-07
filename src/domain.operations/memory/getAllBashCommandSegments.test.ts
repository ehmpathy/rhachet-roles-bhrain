import { getAllBashCommandSegments } from './getAllBashCommandSegments';

/**
 * .what = data-driven cases for the split of a command line into simple commands
 * .why = a copy verb grades only its own command; each separator gets its own row
 */
const TEST_CASES: Array<{
  description: string;
  command: string;
  expect: string[];
}> = [
  { description: 'one command', command: 'cp a b', expect: ['cp a b'] },
  {
    description: 'a pipe',
    command: 'cat a | tee b',
    expect: ['cat a', 'tee b'],
  },
  {
    description: 'an && chain',
    command: 'mv a b && cat c',
    expect: ['mv a b', 'cat c'],
  },
  {
    description: 'an || chain',
    command: 'ls a || cp b c',
    expect: ['ls a', 'cp b c'],
  },
  {
    description: 'a sequence',
    command: 'ls; cp a b',
    expect: ['ls', 'cp a b'],
  },
  { description: 'a newline', command: 'ls\ncp a b', expect: ['ls', 'cp a b'] },
  {
    description: 'a `>|` noclobber redirect is no pipe',
    command: 'echo x >| out.txt',
    expect: ['echo x >| out.txt'],
  },
  {
    description: 'a `2>&1` is no separator',
    command: 'npm test 2>&1',
    expect: ['npm test 2>&1'],
  },
  {
    description: 'a `;` inside double quotes stays in its command',
    command: 'cp "a;b" c && ls',
    expect: ['cp "a;b" c', 'ls'],
  },
  {
    description: 'a `|` inside single quotes stays in its command',
    command: "grep 'a|b' c; ls",
    expect: ["grep 'a|b' c", 'ls'],
  },
  {
    description: 'a `bash -c` command string stays one command',
    command: 'bash -c "cp a b; ls" | cat',
    expect: ['bash -c "cp a b; ls"', 'cat'],
  },
  {
    description: 'a single quote inside double quotes opens no span',
    command: `echo "it's" ; ls`,
    expect: [`echo "it's"`, 'ls'],
  },
  {
    description: 'a lone `&` backgrounds a job and parts it',
    command: 'echo hi & cp a b',
    expect: ['echo hi', 'cp a b'],
  },
  {
    description: 'a `&>` redirect is no separator',
    command: 'npm test &> out.log',
    expect: ['npm test &> out.log'],
  },
  {
    description: 'an escaped quote opens no span',
    command: 'echo \\"; cp a b; echo \\"',
    expect: ['echo \\"', 'cp a b', 'echo \\"'],
  },
  { description: 'an empty command', command: '', expect: [] },
];

describe('getAllBashCommandSegments', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllBashCommandSegments({ command: thisCase.command })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
