import { asPathAbsoluteFromCwd } from './asPathAbsoluteFromCwd';

const TEST_CASES = [
  {
    description: 'keeps an absolute path as given',
    given: { path: '/abs/review.md', cwd: '/repo' },
    expect: { output: '/abs/review.md' },
  },
  {
    description: 'joins a relative path onto the cwd',
    given: { path: '.reviews/review.md', cwd: '/repo' },
    expect: { output: '/repo/.reviews/review.md' },
  },
  {
    description:
      'joins a parent-relative path onto the cwd, then normalizes it',
    given: { path: '../out/review.md', cwd: '/repo/sub' },
    expect: { output: '/repo/out/review.md' },
  },
];

describe('asPathAbsoluteFromCwd', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asPathAbsoluteFromCwd(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
