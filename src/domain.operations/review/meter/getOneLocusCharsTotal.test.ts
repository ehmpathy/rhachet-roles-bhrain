import { getOneLocusCharsTotal } from './getOneLocusCharsTotal';

const asLocus = (input: {
  files: number[];
  additions: number[];
  deletions: number[];
  mutations: number[];
}) => ({
  targetFiles: input.files.map((chars) => ({ path: 'f', chars })),
  'targetDiffs.additions': input.additions.map((chars) => ({
    path: 'a',
    chars,
  })),
  'targetDiffs.deletions': input.deletions.map((chars) => ({
    path: 'd',
    chars,
  })),
  'targetDiffs.mutations': input.mutations.map((chars) => ({
    path: 'm',
    chars,
  })),
});

const TEST_CASES = [
  {
    description: 'an empty locus → zero chars',
    given: {
      locus: asLocus({
        files: [],
        additions: [],
        deletions: [],
        mutations: [],
      }),
    },
    expect: 0,
  },
  {
    description: 'one input alone carries mass → its sum',
    given: {
      locus: asLocus({
        files: [100, 50],
        additions: [],
        deletions: [],
        mutations: [],
      }),
    },
    expect: 150,
  },
  {
    description: 'every input carries mass → the sum across all four',
    given: {
      locus: asLocus({
        files: [100],
        additions: [40, 2],
        deletions: [8],
        mutations: [25],
      }),
    },
    expect: 175,
  },
];

describe('getOneLocusCharsTotal', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneLocusCharsTotal(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
