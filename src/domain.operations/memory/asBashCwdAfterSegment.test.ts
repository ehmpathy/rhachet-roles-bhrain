import { asBashCwdAfterSegment } from './asBashCwdAfterSegment';

/**
 * .what = data-driven cases for the cwd fold through one simple command
 * .why = a relative redirect or a copy is graded at the cwd this computes
 */
const TEST_CASES: Array<{
  description: string;
  segment: string;
  cwd: string | null;
  expect: string | null;
}> = [
  {
    description: 'a non-cd keeps the cwd',
    segment: 'ls',
    cwd: '/r',
    expect: '/r',
  },
  {
    description: 'an absolute cd replaces it',
    segment: 'cd /a/b',
    cwd: '/r',
    expect: '/a/b',
  },
  {
    description: 'a home cd replaces it',
    segment: 'cd ~/.claude/projects/p',
    cwd: null,
    expect: '~/.claude/projects/p',
  },
  {
    description: 'a relative cd joins a known cwd',
    segment: 'cd memory',
    cwd: '~/.claude/projects/p',
    expect: '~/.claude/projects/p/memory',
  },
  {
    description: 'a relative cd with no cwd known is unknown',
    segment: 'cd memory',
    cwd: null,
    expect: null,
  },
  {
    description: 'a pushd moves it too',
    segment: 'pushd /a',
    cwd: '/r',
    expect: '/a',
  },
  ...['\\cd /a', "'cd' /a", '"cd" /a', '(\\cd /a', '\\pushd /a'].map(
    (segment) => ({
      description: `an escaped or quoted lead still moves it: ${segment}`,
      segment,
      cwd: '/r',
      expect: '/a',
    }),
  ),
  {
    description: 'a popd is unknown',
    segment: 'popd',
    cwd: '/r',
    expect: null,
  },
  {
    description: 'a cd - is unknown',
    segment: 'cd -',
    cwd: '/r',
    expect: null,
  },
  {
    description: 'a bare cd is unknown',
    segment: 'cd',
    cwd: '/r',
    expect: null,
  },
  {
    description: 'a var target is unknown',
    segment: 'cd $D',
    cwd: '/r',
    expect: null,
  },
  {
    description: 'a cd inside a subshell',
    segment: '(cd /a/b',
    cwd: '/r',
    expect: '/a/b',
  },
  {
    description: 'a cd inside a brace group',
    segment: '{ cd /a/b',
    cwd: '/r',
    expect: '/a/b',
  },
  {
    description: 'a quoted target',
    segment: 'cd "/a/b"',
    cwd: '/r',
    expect: '/a/b',
  },
  {
    description: 'a quoted target with a space is unknown',
    segment: 'cd "/a/my dir"',
    cwd: '/r',
    expect: null,
  },
  {
    description: 'an option word before the target is skipped',
    segment: 'cd -P /a/b',
    cwd: '/r',
    expect: '/a/b',
  },
  {
    description: 'an end-of-options mark before the target is skipped',
    segment: 'cd -- b',
    cwd: '/r',
    expect: '/r/b',
  },
  {
    description: 'a cd with only option words is unknown',
    segment: 'cd -P',
    cwd: '/r',
    expect: null,
  },
  {
    description: 'a $HOME target is unknown',
    segment: 'cd $HOME/.claude/projects/p/memory',
    cwd: '/r',
    expect: null,
  },
];

describe('asBashCwdAfterSegment', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asBashCwdAfterSegment({ segment: thisCase.segment, cwd: thisCase.cwd }),
      ).toEqual(thisCase.expect);
    }),
  );
});
