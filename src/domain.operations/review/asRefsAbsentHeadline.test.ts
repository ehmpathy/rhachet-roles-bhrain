import { asRefsAbsentHeadline } from './asRefsAbsentHeadline';

const TEST_CASES = [
  {
    description: 'an explicit path names itself',
    given: { refGlobs: ['briefs/*.md', 'docs/guide.md'] },
    expect: { output: 'ref not found: docs/guide.md' },
  },
  {
    description: 'globs alone report what they swept',
    given: { refGlobs: ['briefs/*.md', 'docs/**/*.md'] },
    expect: { output: 'no refs matched glob: briefs/*.md, docs/**/*.md' },
  },
];

describe('asRefsAbsentHeadline', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asRefsAbsentHeadline(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
