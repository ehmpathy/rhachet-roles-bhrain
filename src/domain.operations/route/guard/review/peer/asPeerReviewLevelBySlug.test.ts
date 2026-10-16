import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { RouteStoneGuardReviewPeer } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asPeerReviewLevelBySlug } from './asPeerReviewLevelBySlug';
import { computePeerFeedbackUnabsorbedUnforgiven } from './computePeerFeedbackUnabsorbedUnforgiven';

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
          // 🟡 this is the assertion that matters, and [t0] alone does not make it.
          //    in computePeerFeedbackUnabsorbedUnforgiven the MISS IS THE RETIRED TEST
          //    (`retired: !levelBySlug.has(slug)`), so a raw-keyed map does not merely
          //    lose a level — it declares a fully-configured reviewer retired, and the
          //    halt prompt then prints "it will not speak again" about a reviewer that
          //    will.
          const result = computePeerFeedbackUnabsorbedUnforgiven({
            // the reviewer as it comes back OFF DISK — sanitized by the write side
            feedbackUnabsorbed: [{ slug: '.test-mock-review.sh' }],
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

  given(
    '[case3] a review that bypassed the parser and carries no level',
    () => {
      // `level` is required on the type, but the value is born in guard yaml at runtime. an
      // object built from raw json skips parseStoneGuard's default, and the type cannot see it
      const peerReviews: RouteStoneGuardReviewPeer[] = [
        JSON.parse('{ "slug": "architect", "run": "noop", "budget": 3 }'),
      ];

      when('[t0] indexed', () => {
        then('🔴 it fails loud, never a silent undefined level', () => {
          const error = getError(() =>
            asPeerReviewLevelBySlug({ peerReviews }),
          );
          expect(error).toBeInstanceOf(MalfunctionError);
          expect(error.message).toContain('no integer level');
          // the refusal names the fix — the parser that owes the default
          expect(error.message).toContain('parseStoneGuard must default it');
        });
      });
    },
  );
});
