import { isReviewSupplyAsked } from './isReviewSupplyAsked';

const TEST_CASES = [
  {
    description: 'none of the three — not asked',
    given: { rules: undefined, diffs: undefined, paths: undefined },
    expect: false,
  },
  {
    description: 'empty globs and an empty diff range — not asked',
    given: { rules: [], diffs: '', paths: '' },
    expect: false,
  },
  {
    description: 'rules alone — asked',
    given: { rules: 'rules/*.md', diffs: undefined, paths: undefined },
    expect: true,
  },
  {
    description: 'diffs alone — asked',
    given: { rules: undefined, diffs: 'since-main', paths: undefined },
    expect: true,
  },
  {
    description: 'paths alone — asked',
    given: { rules: undefined, diffs: undefined, paths: ['src/**/*.ts'] },
    expect: true,
  },
];

describe('isReviewSupplyAsked', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isReviewSupplyAsked(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
