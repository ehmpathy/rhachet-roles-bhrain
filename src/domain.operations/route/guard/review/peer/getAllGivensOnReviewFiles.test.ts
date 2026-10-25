import { given, then, when } from 'test-fns';

import { getAllGivensOnReviewFiles } from './getAllGivensOnReviewFiles';
import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';

const FILE_A = '1.test._.review.i001.abc123.r001._.given.by_peer.alpha.md';
const FILE_B = '1.test._.review.i001.abc123.r002._.given.by_peer.beta.md';

const asGiven = (input: {
  slug: string;
  pathGiven: string;
}): RouteGuardReviewPeerGiven => ({
  slug: input.slug,
  blockers: 2,
  nitpicks: 0,
  unreadable: false,
  constraint: null,
  iteration: 1,
  pathGiven: input.pathGiven,
});

/**
 * .what = the narrow that keeps a stance on an overruled lane from a shed of a live lane's sum
 */
describe('getAllGivensOnReviewFiles', () => {
  given('[case1] lane alpha was overruled, so only beta is counted', () => {
    const givens = [
      asGiven({ slug: 'alpha', pathGiven: `/real/.reviews/peer/${FILE_A}` }),
      asGiven({ slug: 'beta', pathGiven: `/real/.reviews/peer/${FILE_B}` }),
    ];

    when('[t0] the counted files are read through another directory', () => {
      then('only beta stays — alpha can no longer shed', () => {
        const kept = getAllGivensOnReviewFiles({
          givens,
          reviewFiles: [`/alias/.reviews/peer/${FILE_B}`],
        });
        expect(kept.map((one) => one.slug)).toEqual(['beta']);
      });
    });
  });

  given('[case2] no level was overruled', () => {
    when('[t0] every given is counted', () => {
      then('every given stays', () => {
        const givens = [
          asGiven({ slug: 'alpha', pathGiven: FILE_A }),
          asGiven({ slug: 'beta', pathGiven: FILE_B }),
        ];
        expect(
          getAllGivensOnReviewFiles({ givens, reviewFiles: [FILE_A, FILE_B] }),
        ).toEqual(givens);
      });
    });
  });
});
