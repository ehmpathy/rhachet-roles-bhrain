import { getAllWarmerFlagsMalformed } from './getAllWarmerFlagsMalformed';

const TEST_CASES = [
  {
    description: 'both numeric flags are positive numbers: none malformed',
    given: { pokes: 3, every: 4 },
    expect: [],
  },
  {
    description:
      'a non-numeric --pokes parses to NaN: it is malformed, not absent',
    given: { pokes: Number('abc'), every: 4 },
    expect: ['--pokes'],
  },
  {
    description: 'a zero --every is malformed: a warmer needs an interval',
    given: { pokes: 3, every: 0 },
    expect: ['--every'],
  },
  {
    description: 'a negative or infinite value is malformed',
    given: { pokes: -1, every: Infinity },
    expect: ['--pokes', '--every'],
  },
  {
    description: 'an absent flag is not malformed: the absent list names it',
    given: { pokes: undefined, every: undefined },
    expect: [],
  },
];

describe('getAllWarmerFlagsMalformed', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = getAllWarmerFlagsMalformed({ options: thisCase.given });
      expect(output).toEqual(thisCase.expect);
    }),
  );
});
