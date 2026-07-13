import { given, then, when } from 'test-fns';

import { getRouteGuardReviewPeerPathMeta } from './getRouteGuardReviewPeerPathMeta';

describe('getRouteGuardReviewPeerPathMeta', () => {
  given('[case1] a given path with a simple slug', () => {
    const pathGiven =
      '.reviews/peer/1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md';

    when('[t0] the meta is parsed', () => {
      then('extracts slug and hash', () => {
        const meta = getRouteGuardReviewPeerPathMeta({ path: pathGiven });
        expect(meta).toEqual({ slug: 'arch', hash: 'abc123' });
      });
    });
  });

  given('[case2] a taken path with a multi-part slug', () => {
    const pathTaken =
      '.reviews/peer/3.exec._.review.i002.def456.r003._.taken.by_self.enroll-blueprint-arch-defects.md';

    when('[t0] the meta is parsed', () => {
      then('extracts the full slug verbatim', () => {
        const meta = getRouteGuardReviewPeerPathMeta({ path: pathTaken });
        expect(meta.slug).toEqual('enroll-blueprint-arch-defects');
        expect(meta.hash).toEqual('def456');
      });
    });
  });

  given('[case3] a sanitized slug that itself contains dots', () => {
    const pathGiven =
      '.reviews/peer/1.vision._.review.i001.abc123.r001._.given.by_peer..test-mock-review.sh.md';

    when('[t0] the meta is parsed', () => {
      then('greedily captures the slug up to the .md suffix', () => {
        const meta = getRouteGuardReviewPeerPathMeta({ path: pathGiven });
        expect(meta.slug).toEqual('.test-mock-review.sh');
        expect(meta.hash).toEqual('abc123');
      });
    });
  });

  given('[case4] a malformed path with no given/taken infix', () => {
    when('[t0] the meta is parsed', () => {
      then('throws — not a valid peer-review filename', () => {
        expect(() =>
          getRouteGuardReviewPeerPathMeta({
            path: '.reviews/peer/1.vision._.report.md',
          }),
        ).toThrow('could not parse peer-review path meta');
      });
    });
  });
});
