import { asReviewGivenKey } from './asReviewGivenKey';

const FILENAME =
  '1.vision._.review.i003.3ce83c4d8c514c8d07.r002._.given.by_peer.friction.md';

const TEST_CASES = [
  {
    description: 'an absolute path, as a pre-key stance row carries',
    given: {
      path: `/home/a/repo/.behavior/v1.route/.reviews/peer/${FILENAME}`,
    },
    expect: { output: FILENAME },
  },
  {
    description:
      'the same given under another absolute path (a symlinked alias)',
    given: { path: `/tmp/alias/.behavior/v1.route/.reviews/peer/${FILENAME}` },
    expect: { output: FILENAME },
  },
  {
    description: 'a relative path',
    given: { path: `.behavior/v1.route/.reviews/peer/${FILENAME}` },
    expect: { output: FILENAME },
  },
  {
    description:
      'the filename alone, as a keyed stance row carries — idempotent',
    given: { path: FILENAME },
    expect: { output: FILENAME },
  },
];

describe('asReviewGivenKey', () => {
  TEST_CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(asReviewGivenKey(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
