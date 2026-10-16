import { asReviewTreeDirs } from './asReviewTreeDirs';

const asEntry = (input: { name: string; kind: 'dir' | 'link' | 'file' }) => ({
  name: input.name,
  isDirectory: () => input.kind === 'dir',
  isSymbolicLink: () => input.kind === 'link',
});

const TEST_CASES = [
  {
    description: 'keeps dirs and symlinks, drops files',
    given: {
      entries: [
        asEntry({ name: 'b-tree', kind: 'dir' }),
        asEntry({ name: 'notes.md', kind: 'file' }),
        asEntry({ name: 'a-tree', kind: 'link' }),
      ],
    },
    expect: {
      output: [
        { name: 'a-tree', dir: '/grove/a-tree' },
        { name: 'b-tree', dir: '/grove/b-tree' },
      ],
    },
  },
  {
    description: 'an empty grove yields no trees',
    given: { entries: [] },
    expect: { output: [] },
  },
];

describe('asReviewTreeDirs', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asReviewTreeDirs({ root: '/grove', entries: thisCase.given.entries }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
