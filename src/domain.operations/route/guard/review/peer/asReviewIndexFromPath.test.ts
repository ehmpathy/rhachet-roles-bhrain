import { asReviewIndexFromPath } from './asReviewIndexFromPath';

const TEST_CASES = [
  {
    description: 'reads the index from a given filename',
    given: {
      path: '.behavior/r/.reviews/peer/1.vision._.review.i002.abc123.r3._.given.by_peer.lint.md',
    },
    expect: { output: 3 },
  },
  {
    description: 'reads a multi-digit index',
    given: {
      path: '1.vision._.review.i010.abc123.r12._.taken.by_self.lint.md',
    },
    expect: { output: 12 },
  },
  {
    description: 'reads only the basename, never a dir segment',
    given: {
      path: 'dir.r9.x/1.vision._.review.i001.abc.r2._.given.by_peer.a.md',
    },
    expect: { output: 2 },
  },
  {
    description:
      'parses a path that names no file on disk — a string parse, never a read',
    given: {
      path: '/absent-root-of-no-disk/1.vision._.review.i001.abc.r7._.given.by_peer.a.md',
    },
    expect: { output: 7 },
  },
  {
    description: 'falls back to 0 when the filename holds no index marker',
    given: { path: 'review.md' },
    expect: { output: 0 },
  },
];

describe('asReviewIndexFromPath', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asReviewIndexFromPath({ path: thisCase.given.path });
      expect(output).toEqual(thisCase.expect.output);
    }),
  );
});
