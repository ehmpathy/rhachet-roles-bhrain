import { asSuppliedFilesSection } from './asSuppliedFilesSection';

/**
 * .what = data-driven cases for asSuppliedFilesSection
 * .why = 🔴 an empty list must answer `null`, never `''`: an empty string emits an empty
 *        tag a census counts as markup with no body. and the delimiters must stay the ones
 *        `asPromptSectionChars` parts the artifact by
 */
const CASES: {
  description: string;
  files: Array<{ path: string; content: string }>;
  expected: string | null;
}[] = [
  {
    description: '🔴 no files → null, never an empty string',
    files: [],
    expected: null,
  },
  {
    description: 'one file → its header and body',
    files: [{ path: 'a.md', content: 'body' }],
    expected: '### a.md\n\nbody',
  },
  {
    description: 'two files → joined by the rule delimiter',
    files: [
      { path: 'a.md', content: 'one' },
      { path: 'b.md', content: 'two' },
    ],
    expected: '### a.md\n\none\n\n---\n\n### b.md\n\ntwo',
  },
];

describe('asSuppliedFilesSection', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(asSuppliedFilesSection({ files: thisCase.files })).toEqual(
        thisCase.expected,
      );
    }),
  );
});
