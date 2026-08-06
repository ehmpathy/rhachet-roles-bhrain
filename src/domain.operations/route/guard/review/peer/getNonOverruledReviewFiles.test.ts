import { given, then, when } from 'test-fns';

import type { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getNonOverruledReviewFiles } from './getNonOverruledReviewFiles';

// three peer reviewers: r1+r2 at level 1, r3 at level 3
const peerReviews = [
  { slug: 'alpha', level: 1 },
  { slug: 'beta', level: 1 },
  { slug: 'gamma', level: 3 },
] as unknown as RouteStoneGuardReviewPeer[];

const files = [
  '/x/stone.guard.review.i5.hash.r1.given.by_peer.alpha.md',
  '/x/stone.guard.review.i5.hash.r2.given.by_peer.beta.md',
  '/x/stone.guard.review.i5.hash.r3.given.by_peer.gamma.md',
];

describe('getNonOverruledReviewFiles', () => {
  given('no overruled levels', () => {
    when('filtered', () => {
      then('every file is kept', () => {
        const kept = getNonOverruledReviewFiles({
          reviewFiles: files,
          peerReviews,
          overruledLevels: new Set<number>(),
        });
        expect(kept).toEqual(files);
      });
    });
  });

  given('level 1 overruled', () => {
    when('filtered', () => {
      then('the two level-1 files are dropped, level-3 kept', () => {
        const kept = getNonOverruledReviewFiles({
          reviewFiles: files,
          peerReviews,
          overruledLevels: new Set([1]),
        });
        expect(kept).toEqual([files[2]]);
      });
    });
  });

  given('level 3 overruled', () => {
    when('filtered', () => {
      then('the level-3 file is dropped, level-1 kept', () => {
        const kept = getNonOverruledReviewFiles({
          reviewFiles: files,
          peerReviews,
          overruledLevels: new Set([3]),
        });
        expect(kept).toEqual([files[0], files[1]]);
      });
    });
  });

  given('a file with no .rN. marker', () => {
    when('filtered with level 1 NOT overruled', () => {
      then('it falls back to level 1 and is kept', () => {
        const kept = getNonOverruledReviewFiles({
          reviewFiles: ['/x/stone.guard.review.no-index.md'],
          peerReviews,
          overruledLevels: new Set([3]),
        });
        expect(kept).toEqual(['/x/stone.guard.review.no-index.md']);
      });
    });

    when('filtered with level 1 overruled', () => {
      then('its fallback level 1 is overruled, so it is dropped', () => {
        const kept = getNonOverruledReviewFiles({
          reviewFiles: ['/x/stone.guard.review.no-index.md'],
          peerReviews,
          overruledLevels: new Set([1]),
        });
        expect(kept).toEqual([]);
      });
    });
  });
});
