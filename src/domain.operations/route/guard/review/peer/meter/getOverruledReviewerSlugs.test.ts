import { given, then, when } from 'test-fns';

import { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getOverruledReviewerSlugs } from './getOverruledReviewerSlugs';

/**
 * .what = unit coverage for the overruled-reviewer-slug selector
 * .why = an overruled level's reviewers are forgiven; this pins that the selection is level-scoped
 *        (one overruled level does not forgive another).
 */
const review = (slug: string, level: number): RouteStoneGuardReviewPeer =>
  new RouteStoneGuardReviewPeer({ slug, run: 'noop', budget: 3, level });

describe('getOverruledReviewerSlugs', () => {
  given('[case1] one of two levels overruled — level-scoped', () => {
    when('[t0] computed with level 1 overruled', () => {
      const result = getOverruledReviewerSlugs({
        peerReviews: [review('alpha', 1), review('beta', 3)],
        overruledLevels: new Set([1]),
      });

      then('only the l1 reviewer slug is forgiven', () => {
        expect(result).toEqual(['alpha']);
      });
    });
  });

  given('[case2] both levels overruled — every slug forgiven', () => {
    when('[t0] computed', () => {
      const result = getOverruledReviewerSlugs({
        peerReviews: [review('alpha', 1), review('beta', 3)],
        overruledLevels: new Set([1, 3]),
      });

      then('both slugs are forgiven', () => {
        expect(result).toEqual(['alpha', 'beta']);
      });
    });
  });

  given('[case3] no overrule — none forgiven', () => {
    when('[t0] computed', () => {
      const result = getOverruledReviewerSlugs({
        peerReviews: [review('alpha', 1), review('beta', 3)],
        overruledLevels: new Set(),
      });

      then('no slug is forgiven', () => {
        expect(result).toEqual([]);
      });
    });
  });

  given('[case4] a LEGACY slug that holds a path separator', () => {
    // this is not a hypothetical shape. the legacy flat guard format derives a slug from
    // the review command itself (parseStoneGuard.ts:412-413), and standardizePeerReviewSlugs
    // only dedupes collisions — it never strips separators. so `.test/mock-review.sh` is a
    // real, live, fully-configured reviewer.
    //
    // 🔴 the set this returns is compared against slugs parsed OFF DISK, and a disk slug is
    //    always sanitized (the write side swaps separators into the .given filename). raw,
    //    the two could never match: the human's overrule would silently fail to forgive the
    //    reviewer, and the same mismatch marked it `retired` in the halt prompt
    //    (r11 blocker.1, i005).
    when('[t0] its level is overruled', () => {
      const result = getOverruledReviewerSlugs({
        peerReviews: [review('.test/mock-review.sh', 1)],
        overruledLevels: new Set([1]),
      });

      then('the slug comes back SANITIZED, so it can match a disk slug', () => {
        expect(result).toEqual(['.test-mock-review.sh']);
      });
    });
  });
});
