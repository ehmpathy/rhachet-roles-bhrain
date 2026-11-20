import { asFulcrumCaseFromFileName } from './asFulcrumCaseFromFileName';

const TEST_CASES = [
  {
    description: 'splits the case id from its title',
    given: { name: 'inventory.of=fulcrums.case=F44-rename-table.md' },
    expect: { output: { slug: 'F44', title: 'rename-table' } },
  },
  {
    description: 'reads a segment with no title as its own title',
    given: { name: 'inventory.of=fulcrums.case=F44.md' },
    expect: { output: { slug: 'F44', title: 'F44' } },
  },
  {
    description: 'rejects the summary, which is no entry',
    given: { name: 'inventory.of=fulcrums._.md' },
    expect: { output: null },
  },
  {
    description: 'rejects a file that is no fulcrum',
    given: { name: 'notes.md' },
    expect: { output: null },
  },
];

describe('asFulcrumCaseFromFileName', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asFulcrumCaseFromFileName(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
