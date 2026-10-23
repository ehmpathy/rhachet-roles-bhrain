import { asTokenAllocation } from './asTokenAllocation';

const TEST_CASES = [
  {
    description: 'equal weights split evenly',
    given: { total: 9, weights: [1, 1, 1] },
    expect: { allocation: [3, 3, 3] },
  },
  {
    description: 'a remainder goes to the largest fraction, and the sum holds',
    given: { total: 10, weights: [1, 1, 1] },
    expect: { allocation: [4, 3, 3] },
  },
  {
    description: 'weights by bytes apportion proportionally',
    given: { total: 100, weights: [300, 100] },
    expect: { allocation: [75, 25] },
  },
  {
    description: 'a zero total allocates zero to each',
    given: { total: 0, weights: [5, 5] },
    expect: { allocation: [0, 0] },
  },
  {
    description: 'all-zero weights allocate zero to each',
    given: { total: 7, weights: [0, 0] },
    expect: { allocation: [0, 0] },
  },
];

describe('asTokenAllocation', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const allocation = asTokenAllocation(thisCase.given);
      expect(allocation).toEqual(thisCase.expect.allocation);
    }),
  );

  test('the parts always sum to the whole, for awkward weights', () => {
    const allocation = asTokenAllocation({
      total: 1_000_003,
      weights: [7, 13, 29, 31, 1],
    });
    expect(allocation.reduce((sum, part) => sum + part, 0)).toEqual(1_000_003);
  });
});
