import { getAllTargetsAsContext } from './getAllTargetsAsContext';

const TEST_CASES = [
  {
    description: 'a whole run reads naught as context only',
    given: { partition: undefined },
    expect: { output: undefined },
  },
  {
    description: 'the common files another partition grades are context here',
    given: {
      partition: { common: ['a.md', 'b.md'], commonGraded: ['a.md'] },
    },
    expect: { output: ['b.md'] },
  },
  {
    description:
      'a partition that grades every common file reads none as context',
    given: { partition: { common: ['a.md'], commonGraded: ['a.md'] } },
    expect: { output: [] },
  },
];

describe('getAllTargetsAsContext', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getAllTargetsAsContext(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
