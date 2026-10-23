import { getAllJudgeMalfunctions } from './getAllJudgeMalfunctions';

const TEST_CASES: Array<{
  description: string;
  given: {
    judges: Array<{ exitClass: string; index: number }>;
    forgiven: number[];
  };
  expect: { indexes: number[] };
}> = [
  {
    description: 'keeps a judge that malfunctioned and is not forgiven',
    given: { judges: [{ exitClass: 'malfunction', index: 1 }], forgiven: [] },
    expect: { indexes: [1] },
  },
  {
    description: 'drops a judge that malfunctioned and is forgiven',
    given: { judges: [{ exitClass: 'malfunction', index: 1 }], forgiven: [1] },
    expect: { indexes: [] },
  },
  {
    description: 'drops a judge that did not malfunction',
    given: { judges: [{ exitClass: 'passed', index: 1 }], forgiven: [] },
    expect: { indexes: [] },
  },
];

describe('getAllJudgeMalfunctions', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = getAllJudgeMalfunctions({
        judges: thisCase.given.judges,
        isForgiven: (judge) => thisCase.given.forgiven.includes(judge.index),
      });
      expect(output.map((judge) => judge.index)).toEqual(
        thisCase.expect.indexes,
      );
    }),
  );
});
