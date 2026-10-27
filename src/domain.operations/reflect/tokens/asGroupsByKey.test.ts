import { asGroupsByKey } from './asGroupsByKey';

const TEST_CASES: {
  description: string;
  given: { items: { key: string; value: number }[] };
  expect: number[][];
}[] = [
  {
    description: 'groups appear in the order their key first appears',
    given: {
      items: [
        { key: 'b', value: 1 },
        { key: 'a', value: 2 },
        { key: 'b', value: 3 },
        { key: 'c', value: 4 },
        { key: 'a', value: 5 },
      ],
    },
    expect: [[1, 3], [2, 5], [4]],
  },
  {
    description: 'no items → no groups',
    given: { items: [] },
    expect: [],
  },
];

describe('asGroupsByKey', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const groups = asGroupsByKey({
        items: thisCase.given.items,
        keyOf: (item) => item.key,
      });
      expect(groups.map((group) => group.map((item) => item.value))).toEqual(
        thisCase.expect,
      );
    }),
  );
});
