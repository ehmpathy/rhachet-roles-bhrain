import { asLeavesCapped } from './asLeavesCapped';

const TEST_CASES = [
  {
    description: 'a list under the cap shows whole',
    given: { items: ['a', 'b'], cap: 3 },
    expect: { output: ['a', 'b'] },
  },
  {
    description: 'a list exactly at the cap shows whole, with no more-leaf',
    given: { items: ['a', 'b', 'c'], cap: 3 },
    expect: { output: ['a', 'b', 'c'] },
  },
  {
    description: 'a list past the cap shows the first cap, then names the rest',
    given: { items: ['a', 'b', 'c', 'd', 'e'], cap: 3 },
    expect: { output: ['a', 'b', 'c', '(2 more)'] },
  },
  {
    description: 'an empty list stays empty',
    given: { items: [], cap: 3 },
    expect: { output: [] },
  },
];

describe('asLeavesCapped', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asLeavesCapped(thisCase.given);
      expect(output).toEqual(thisCase.expect.output);
    }),
  );
});
