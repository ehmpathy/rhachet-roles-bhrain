import { asReviewRubricOutputPath } from './asReviewRubricOutputPath';

const TEST_CASES = [
  {
    description: 'joins a relative output dir and the rubric slug',
    given: { outputDir: '.reviews/by=mechanic', slug: 'failhides' },
    expect: { output: '.reviews/by=mechanic/rubric=failhides.md' },
  },
  {
    description: 'keeps an absolute output dir absolute',
    given: { outputDir: '/tmp/out', slug: 'decode-friction' },
    expect: { output: '/tmp/out/rubric=decode-friction.md' },
  },
];

describe('asReviewRubricOutputPath', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asReviewRubricOutputPath(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
