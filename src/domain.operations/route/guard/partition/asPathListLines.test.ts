import { asPathListLines } from './asPathListLines';

const PATHS = ['a.ts', 'b.ts', 'c.ts', 'd.ts'];

const TEST_CASES = [
  {
    description: 'a list within its cap shows every row, the last one closed',
    given: { rows: PATHS, limit: 5, gutter: '   ', closes: true },
    expect: ['   ├─ a.ts', '   ├─ b.ts', '   ├─ c.ts', '   └─ d.ts'],
  },
  {
    description: 'a list past its cap shows its head and names the remainder',
    given: { rows: PATHS, limit: 2, gutter: '   ', closes: true },
    expect: [
      '   ├─ a.ts',
      '   ├─ b.ts',
      '   └─ … +2 more (--full lists every path)',
    ],
  },
  {
    description: 'a null limit lists every row',
    given: { rows: PATHS, limit: null, gutter: '', closes: true },
    expect: ['├─ a.ts', '├─ b.ts', '├─ c.ts', '└─ d.ts'],
  },
  {
    description:
      'a list that does not close its parent leaves its last row open',
    given: { rows: PATHS, limit: 1, gutter: '', closes: false },
    expect: ['├─ a.ts', '├─ … +3 more (--full lists every path)'],
  },
  {
    description: 'an empty list renders naught',
    given: { rows: [], limit: 5, gutter: '', closes: true },
    expect: [],
  },
];

describe('asPathListLines', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asPathListLines(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
