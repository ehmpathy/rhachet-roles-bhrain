import { isBashPathAnchored } from './isBashPathAnchored';

/**
 * .what = data-driven cases for whether a bash path is known before the shell runs
 * .why = an unanchored redirect beside a memory path may land in memory
 */
const TEST_CASES: Array<{
  description: string;
  path: string;
  expect: boolean;
}> = [
  { description: 'an absolute path', path: '/tmp/out.md', expect: true },
  { description: 'a home path', path: '~/notes/out.md', expect: true },
  { description: '/dev/null', path: '/dev/null', expect: true },
  { description: 'a relative path', path: 'out.md', expect: false },
  { description: 'a dot path', path: './out.md', expect: false },
  { description: 'a var path', path: '$D/a.md', expect: false },
  {
    description: 'an absolute path with a var',
    path: '/tmp/$X.md',
    expect: false,
  },
  { description: 'a command substitution', path: '`pwd`/a.md', expect: false },
];

describe('isBashPathAnchored', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isBashPathAnchored({ path: thisCase.path })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
