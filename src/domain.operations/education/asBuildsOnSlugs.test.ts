import { asBuildsOnSlugs } from './asBuildsOnSlugs';

const TEST_CASES: Array<{
  description: string;
  cell: string;
  expected: string[];
}> = [
  { description: 'one slug', cell: 'idempotency', expected: ['idempotency'] },
  {
    description: 'slugs parted by a comma',
    cell: 'idempotency, retries',
    expected: ['idempotency', 'retries'],
  },
  {
    description: 'slugs parted by a middle dot',
    cell: 'idempotency · retries',
    expected: ['idempotency', 'retries'],
  },
  { description: 'an em dash reads as none', cell: '—', expected: [] },
  { description: 'a hyphen reads as none', cell: '-', expected: [] },
  { description: 'the word none reads as none', cell: 'none', expected: [] },
  { description: 'an empty cell reads as none', cell: '', expected: [] },
];

describe('asBuildsOnSlugs', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asBuildsOnSlugs({ cell: thisCase.cell })).toEqual(
        thisCase.expected,
      );
    }),
  );
});
