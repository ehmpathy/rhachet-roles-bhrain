import { given, then, when } from 'test-fns';

import { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getAllReviewPeersByLevel } from './getAllReviewPeersByLevel';

const asPeer = (slug: string, level: number): RouteStoneGuardReviewPeer =>
  new RouteStoneGuardReviewPeer({ slug, run: 'noop', budget: 3, level });

describe('getAllReviewPeersByLevel', () => {
  given('[case1] peers declared out of level order', () => {
    when('[t0] sorted', () => {
      const result = getAllReviewPeersByLevel({
        peerReviews: [asPeer('ergo', 3), asPeer('arch', 1), asPeer('mech', 1)],
      });

      then('the cheapest level leads, ties keep declared order', () => {
        expect(result.map((peer) => peer.slug)).toEqual([
          'arch',
          'mech',
          'ergo',
        ]);
      });

      then('each keeps its DECLARED position, 1-based and 0-based', () => {
        expect(
          result.map((peer) => [peer.slug, peer.index, peer.arrayIndex]),
        ).toEqual([
          ['arch', 2, 1],
          ['mech', 3, 2],
          ['ergo', 1, 0],
        ]);
      });
    });
  });

  given('[case2] the input list', () => {
    when('[t0] sorted', () => {
      const peerReviews = [asPeer('ergo', 3), asPeer('arch', 1)];
      getAllReviewPeersByLevel({ peerReviews });

      then('it is left in declared order', () => {
        expect(peerReviews.map((peer) => peer.slug)).toEqual(['ergo', 'arch']);
      });
    });
  });
});
