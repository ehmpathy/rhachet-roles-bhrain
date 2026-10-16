import { getAllFailedJudges } from './getAllFailedJudges';

const TEST_CASES: Array<{
  description: string;
  given: {
    judges: Array<{ passed: boolean; index: number }>;
    forgiven: number[];
  };
  expect: { indexes: number[] };
}> = [
  {
    description: 'keeps a judge that failed and is not forgiven',
    given: { judges: [{ passed: false, index: 1 }], forgiven: [] },
    expect: { indexes: [1] },
  },
  {
    description: 'drops a judge that failed and is forgiven',
    given: { judges: [{ passed: false, index: 1 }], forgiven: [1] },
    expect: { indexes: [] },
  },
  {
    description: 'drops a judge that passed',
    given: { judges: [{ passed: true, index: 1 }], forgiven: [] },
    expect: { indexes: [] },
  },
];

describe('getAllFailedJudges', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = getAllFailedJudges({
        judges: thisCase.given.judges,
        isForgiven: (judge) => thisCase.given.forgiven.includes(judge.index),
      });
      expect(output.map((judge) => judge.index)).toEqual(
        thisCase.expect.indexes,
      );
    }),
  );
});
