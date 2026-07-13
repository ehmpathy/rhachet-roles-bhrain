import { given, then, when } from 'test-fns';

import { getRouteGuardReviewPeerPathTaken } from './getRouteGuardReviewPeerPathTaken';

describe('getRouteGuardReviewPeerPathTaken', () => {
  given('[case1] a valid given path', () => {
    const pathGiven =
      '.reviews/peer/1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md';

    when('[t0] the taken path is derived', () => {
      then('swaps only the given infix for the taken infix', () => {
        const pathTaken = getRouteGuardReviewPeerPathTaken({ pathGiven });
        expect(pathTaken).toEqual(
          '.reviews/peer/1.vision._.review.i001.abc123.r001._.taken.by_self.arch.md',
        );
      });
    });
  });

  given('[case2] a given path with a sanitized multi-part slug', () => {
    const pathGiven =
      '.reviews/peer/3.exec._.review.i002.def456.r003._.given.by_peer.enroll-blueprint-arch-defects.md';

    when('[t0] the taken path is derived', () => {
      then('inherits the slug verbatim (no re-sanitize, no re-derive)', () => {
        const pathTaken = getRouteGuardReviewPeerPathTaken({ pathGiven });
        expect(pathTaken).toContain(
          '_.taken.by_self.enroll-blueprint-arch-defects.md',
        );
        expect(pathTaken).toContain('.i002.def456.r003.');
      });
    });
  });

  given('[case3] a malformed path with no given infix', () => {
    when('[t0] the taken path is derived', () => {
      then('throws — it is not a valid given path', () => {
        expect(() =>
          getRouteGuardReviewPeerPathTaken({
            pathGiven: '.reviews/peer/1.vision._.report.md',
          }),
        ).toThrow('.given.by_peer');
      });
    });
  });
});
