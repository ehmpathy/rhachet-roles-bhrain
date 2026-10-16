import { asLevelSlotByIndex } from './asLevelSlotByIndex';

const TEST_CASES = [
  {
    description: 'an empty level holds no slots',
    given: { members: [] },
    expect: { output: [] },
  },
  {
    description: 'one member holds slot 0 of 1',
    given: { members: [{ index: 4 }] },
    expect: { output: [[4, { index: 0, total: 1 }]] },
  },
  {
    description:
      'members keyed by declared index, slotted by roster position (not by index value)',
    given: { members: [{ index: 7 }, { index: 2 }, { index: 5 }] },
    expect: {
      output: [
        [7, { index: 0, total: 3 }],
        [2, { index: 1, total: 3 }],
        [5, { index: 2, total: 3 }],
      ],
    },
  },
];

describe('asLevelSlotByIndex', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect([...asLevelSlotByIndex(thisCase.given).entries()]).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
