import { getError, given, then, when } from 'test-fns';

import { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asPeerReviewLevelBySlug } from './asPeerReviewLevelBySlug';
import { computePeerUncontemplatedUnforgiven } from './computePeerUncontemplatedUnforgiven';

const review = (slug: string, level: number): RouteStoneGuardReviewPeer =>
  new RouteStoneGuardReviewPeer({ slug, run: 'noop', budget: 3, level });

describe('asPeerReviewLevelBySlug', () => {
  given('[case1] plain slugs with no separators', () => {
    when('[t0] indexed', () => {
      then('each maps to its own level', () => {
        const result = asPeerReviewLevelBySlug({
          peerReviews: [review('architect', 1), review('mechanic', 3)],
        });
        expect(result.get('architect')).toEqual(1);
        expect(result.get('mechanic')).toEqual(3);
      });
    });
  });

  given('[case3] a review that reached the index with NO level', () => {
    // unreachable via parseStoneGuard, which defaults level at every emit site
    // (:157, :273, :416). the type still permits it, since it doubles as the
    // CONFIG declaration — so this clamps the parse guarantee rather than a
    // caller contract (rule.require.review-standardization-at-parse)
    const peerReviews = [
      new RouteStoneGuardReviewPeer({
        slug: 'architect',
        run: 'noop',
        budget: 3,
      }),
    ];

    when('[t0] indexed', () => {
      then('it fails loud rather than a silent re-default to 1', () => {
        const error = getError(() => asPeerReviewLevelBySlug({ peerReviews }));
        expect(error.message).toContain('no level');
        expect(error.message).toContain('parseStoneGuard');
      });
    });
  });

  given('[case2] a LEGACY slug that holds a path separator', () => {
    // the legacy flat guard format derives a slug from the review command itself
    // (parseStoneGuard.ts:412-413), and standardizePeerReviewSlugs only dedupes
    // collisions — it never strips separators. so this is a real, live reviewer.
    const peerReviews = [review('.test/mock-review.sh', 2)];

    when('[t0] indexed', () => {
      then('the KEY is sanitized, so a disk-parsed slug can find it', () => {
        const result = asPeerReviewLevelBySlug({ peerReviews });
        // the disk vocabulary — what the .given filename carries, and therefore what
        // every lookup arrives as
        expect(result.get('.test-mock-review.sh')).toEqual(2);
      });
    });

    when('[t1] the map is handed to the gate that reads it', () => {
      then(
        'the live reviewer is NOT marked retired, and keeps its real level',
        () => {
          // ⚠️ this is the assertion that matters, and [t0] alone does not make it.
          //    in computePeerUncontemplatedUnforgiven the MISS IS THE RETIRED TEST
          //    (`retired: !levelBySlug.has(slug)`), so a raw-keyed map does not merely
          //    lose a level — it declares a fully-configured reviewer retired, and the
          //    halt prompt then prints "it will not speak again" about a reviewer that
          //    will (r11 blocker.1, i005).
          const result = computePeerUncontemplatedUnforgiven({
            // the reviewer as it comes back OFF DISK — sanitized by the write side
            uncontemplated: [{ slug: '.test-mock-review.sh' }],
            overruledSlugs: new Set<string>(),
            levelBySlug: asPeerReviewLevelBySlug({ peerReviews }),
          });

          expect(result).toHaveLength(1);
          expect(result[0]?.retired).toEqual(false);
          expect(result[0]?.level).toEqual(2);
        },
      );
    });
  });
});
