import { getOneBashCopyVerb } from './getOneBashCopyVerb';

/**
 * .what = data-driven cases for the copy verb a simple command may run
 * .why = a verb word counts wherever it sits, so an unknown wrapper blocks; only a
 *        known reader is exempt, and a part of a word or a path never counts
 */
const TEST_CASES: Array<{
  description: string;
  segment: string;
  expect: string | null;
}> = [
  { description: 'cp', segment: 'cp a.md b.md', expect: 'cp' },
  { description: 'mv', segment: 'mv a.md b.md', expect: 'mv' },
  { description: 'tee', segment: 'tee b.md', expect: 'tee' },
  { description: 'tee -a', segment: 'tee -a b.md', expect: 'tee' },
  {
    description: 'rhx teesafe',
    segment: 'rhx teesafe b.md',
    expect: 'teesafe',
  },
  {
    description: 'a linked rhx before teesafe',
    segment: './node_modules/.bin/rhx teesafe b.md',
    expect: 'teesafe',
  },
  { description: 'an absolute cp', segment: '/bin/cp a b', expect: 'cp' },
  { description: 'an escaped cp', segment: '\\cp a b', expect: 'cp' },
  { description: 'sudo cp', segment: 'sudo cp a b', expect: 'cp' },
  {
    description: 'an env assignment before',
    segment: 'LC_ALL=C cp a b',
    expect: 'cp',
  },
  { description: 'a subshell', segment: '(tee b.md)', expect: 'tee' },
  // a wrapper the guard has no name for still runs the verb: it counts
  { description: 'a loop body', segment: 'do cp $f b', expect: 'cp' },
  { description: 'a then branch', segment: 'then cp a b', expect: 'cp' },
  { description: 'a brace group', segment: '{ cp a b', expect: 'cp' },
  { description: 'a negation', segment: '! cp a b', expect: 'cp' },
  {
    description: 'a bash -c command string',
    segment: 'bash -c "cp a b"',
    expect: 'cp',
  },
  {
    description: 'sudo with a flag',
    segment: 'sudo -u root cp a b',
    expect: 'cp',
  },
  { description: 'xargs', segment: 'xargs -I{} cp {} b', expect: 'cp' },
  {
    description: 'find -exec',
    segment: 'find . -exec cp {} b \\',
    expect: 'cp',
  },
  { description: 'timeout', segment: 'timeout 5 tee b', expect: 'tee' },
  { description: 'git mv', segment: 'git -C d mv a b', expect: 'mv' },
  {
    description: 'a reader that runs a command inside $(…)',
    segment: 'echo $(cp a b)',
    expect: 'cp',
  },

  // a known reader only reads: a verb word in its args is data
  { description: 'cat is a read', segment: 'cat a.md', expect: null },
  { description: 'sudo cat', segment: 'sudo cat cp', expect: null },
  {
    description: 'grep with a verb as its pattern',
    segment: 'grep cp a.md',
    expect: null,
  },
  { description: 'grep -c tee', segment: 'grep -c tee a.md', expect: null },
  {
    description: 'a verb as a path segment',
    segment: 'cat ~/.claude/projects/-home-me-cp-tools/memory/a.md',
    expect: null,
  },
  { description: 'a verb inside a word', segment: 'scp a b', expect: null },
  { description: 'an empty segment', segment: '', expect: null },
];

describe('getOneBashCopyVerb', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneBashCopyVerb({ segment: thisCase.segment })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
