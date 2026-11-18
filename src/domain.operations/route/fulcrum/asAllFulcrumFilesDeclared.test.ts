import { asAllFulcrumFilesDeclared } from './asAllFulcrumFilesDeclared';

const TEST_CASES = [
  {
    description: 'declares each entry, sorted, with the case its name carries',
    given: {
      names: [
        'inventory.of=fulcrums.case=F2-b.md',
        'inventory.of=fulcrums.case=F1-a.md',
      ],
    },
    expect: {
      output: [
        {
          name: 'inventory.of=fulcrums.case=F1-a.md',
          declared: { slug: 'F1', title: 'a' },
        },
        {
          name: 'inventory.of=fulcrums.case=F2-b.md',
          declared: { slug: 'F2', title: 'b' },
        },
      ],
    },
  },
  {
    description:
      'leaves out the summary and the verdict ledger, which are no entries',
    given: { names: ['inventory.of=fulcrums._.md', 'verdicts.jsonl'] },
    expect: { output: [] },
  },
  {
    description: 'keeps a misnamed file, with no case, so the gate can name it',
    given: { names: ['F47.deferral.md'] },
    expect: { output: [{ name: 'F47.deferral.md', declared: null }] },
  },
];

describe('asAllFulcrumFilesDeclared', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asAllFulcrumFilesDeclared(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
