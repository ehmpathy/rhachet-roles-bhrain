import { getAllDistinctByKey } from './getAllDistinctByKey';

const TEST_CASES = [
  {
    description: 'no items means no items',
    given: { items: [] as { key: string; tag: string }[] },
    expect: { output: [] },
  },
  {
    description: 'distinct keys are all kept, in input order',
    given: {
      items: [
        { key: 'b', tag: '1' },
        { key: 'a', tag: '2' },
      ],
    },
    expect: {
      output: [
        { key: 'b', tag: '1' },
        { key: 'a', tag: '2' },
      ],
    },
  },
  {
    description: 'a repeated key keeps its FIRST entry only',
    given: {
      items: [
        { key: '@all', tag: 'first' },
        { key: 'peer.x', tag: 'x' },
        { key: '@all', tag: 'second' },
      ],
    },
    expect: {
      output: [
        { key: '@all', tag: 'first' },
        { key: 'peer.x', tag: 'x' },
      ],
    },
  },
];

describe('getAllDistinctByKey', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllDistinctByKey(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
