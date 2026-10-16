import { getOneLocusChars } from './getOneLocusChars';

const TEST_CASES = [
  {
    description: 'no rows → zero chars',
    given: { rows: [] },
    expect: 0,
  },
  {
    description: 'one row → its own chars',
    given: { rows: [{ path: 'src/a.ts', chars: 120 }] },
    expect: 120,
  },
  {
    description: 'many rows → their chars, summed',
    given: {
      rows: [
        { path: 'src/a.ts', chars: 120 },
        { path: 'src/b.ts', chars: 30 },
        { path: 'src/c.ts', chars: 0 },
      ],
    },
    expect: 150,
  },
];

describe('getOneLocusChars', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneLocusChars(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
