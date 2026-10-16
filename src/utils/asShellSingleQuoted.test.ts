import { asShellSingleQuoted } from './asShellSingleQuoted';

const TEST_CASES = [
  {
    description: 'wraps a plain path',
    given: '/tmp/a/b',
    expect: "'/tmp/a/b'",
  },
  {
    description: 'holds a space literally',
    given: '/tmp/a b',
    expect: "'/tmp/a b'",
  },
  {
    description: 'holds a dollar literally',
    given: '/tmp/$HOME',
    expect: "'/tmp/$HOME'",
  },
  {
    description: 'closes, escapes, and reopens around a quote',
    given: "/tmp/it's",
    expect: "'/tmp/it'\\''s'",
  },
];

describe('asShellSingleQuoted', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asShellSingleQuoted({ value: thisCase.given })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
