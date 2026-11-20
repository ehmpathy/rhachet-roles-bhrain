import { asFulcrumFrontmatter } from './asFulcrumFrontmatter';
import { asFulcrumParseFitToFileCase } from './asFulcrumParseFitToFileCase';

const asContent = (input: { case: string }): string =>
  [
    '---',
    `case: ${input.case}`,
    'rework: clean',
    'ground: wrong',
    'confidence: 0.65',
    'status: open',
    'owed: human',
    'holds: [rules/i003/blocker.2]',
    'lean: keep the table as written',
    'verdict: null',
    '---',
  ].join('\n');

const TEST_CASES: Array<{
  description: string;
  given: { case: string; slug: string };
  expect: { kind: string; malformed: string[] };
}> = [
  {
    description: 'a case equal to the file id stays valid',
    given: { case: 'F44', slug: 'F44' },
    expect: { kind: 'valid', malformed: [] },
  },
  {
    description:
      '🔴 clamp. a case that differs from the file id is invalid, and names the id',
    given: { case: 'F44-rename-table', slug: 'F44' },
    expect: {
      kind: 'invalid',
      malformed: ['case (equal to the file id, F44)'],
    },
  },
];

describe('asFulcrumParseFitToFileCase', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const parse = asFulcrumParseFitToFileCase({
        parse: asFulcrumFrontmatter({
          content: asContent({ case: thisCase.given.case }),
        }),
        slug: thisCase.given.slug,
      });
      expect(parse.kind).toEqual(thisCase.expect.kind);
      expect(parse.kind === 'invalid' ? parse.malformed : []).toEqual(
        thisCase.expect.malformed,
      );
    }),
  );

  test('an invalid parse passes through untouched', () => {
    const parse = asFulcrumFrontmatter({ content: '# no frontmatter\n' });
    expect(asFulcrumParseFitToFileCase({ parse, slug: 'F1' })).toBe(parse);
  });
});
