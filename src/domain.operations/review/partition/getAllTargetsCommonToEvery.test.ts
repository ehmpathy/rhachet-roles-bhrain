import { getAllTargetsCommonToEvery } from './getAllTargetsCommonToEvery';

const TEST_CASES = [
  {
    description: 'no partitions share no prefix',
    given: [],
    expect: [],
  },
  {
    description: 'a file every partition carries is shared',
    given: [{ common: ['v.md', 'x.md'] }, { common: ['v.md'] }],
    expect: ['v.md'],
  },
  {
    description: 'the first partition sets the order',
    given: [{ common: ['b.md', 'a.md'] }, { common: ['a.md', 'b.md'] }],
    expect: ['b.md', 'a.md'],
  },
];

describe('getAllTargetsCommonToEvery', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        getAllTargetsCommonToEvery({ partitions: thisCase.given }),
      ).toEqual(thisCase.expect);
    }),
  );
});
