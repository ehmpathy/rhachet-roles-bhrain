import { given, then, when } from 'test-fns';

import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

import { computePromisedReviewCount } from './computePromisedReviewCount';
import { findNextUnpromisedReview } from './findNextUnpromisedReview';
import { isSelfReviewPromised } from './isSelfReviewPromised';

const asReview = (slug: string): RouteStoneGuardReviewSelf =>
  ({ slug }) as RouteStoneGuardReviewSelf;

describe('isSelfReviewPromised', () => {
  given('[case1] a promised slug and an unpromised one', () => {
    when('[t0] the predicate is read', () => {
      then('it answers per slug', () => {
        const promisedSlugs = new Set(['done']);
        expect(
          isSelfReviewPromised({ review: asReview('done'), promisedSlugs }),
        ).toEqual(true);
        expect(
          isSelfReviewPromised({ review: asReview('owed'), promisedSlugs }),
        ).toEqual(false);
      });
    });
  });

  given('[case2] three consumers of the one predicate', () => {
    const selfReviews = ['a', 'b', 'c', 'd'].map(asReview);
    const promisedSlugs = new Set(['a', 'c']);

    when('[t0] each derives its own answer from the shared source', () => {
      // 🔴 the clamp is aimed at the AGREEMENT, never at any one value. a literal
      //    assertion per consumer pins what each SAYS and stays green when one is
      //    rewritten against a hand-typed `.has(slug)` and the three stop to agree
      //    — which is precisely the drift this predicate was extracted to prevent
      then('the count is the complement of the owed set', () => {
        const owed = selfReviews.filter(
          (review) => !isSelfReviewPromised({ review, promisedSlugs }),
        );
        const done = computePromisedReviewCount({ selfReviews, promisedSlugs });

        expect(done + owed.length).toEqual(selfReviews.length);
        expect(done).toEqual(2);
      });

      then('the finder picks the first of the owed set', () => {
        const owed = selfReviews.filter(
          (review) => !isSelfReviewPromised({ review, promisedSlugs }),
        );
        const next = findNextUnpromisedReview({ selfReviews, promisedSlugs });

        // the non-null at setStoneAsPassed rests on exactly this: a non-empty owed
        // set implies the finder returns, and it returns that set's own first member
        expect(owed.length).toBeGreaterThan(0);
        expect(next).not.toEqual(null);
        expect(next!.reviewSelf.slug).toEqual(owed[0]!.slug);
      });
    });

    when('[t1] every review is promised', () => {
      then('the owed set is empty and the finder returns null', () => {
        const allPromised = new Set(['a', 'b', 'c', 'd']);
        const owed = selfReviews.filter(
          (review) =>
            !isSelfReviewPromised({ review, promisedSlugs: allPromised }),
        );

        expect(owed).toEqual([]);
        expect(
          findNextUnpromisedReview({
            selfReviews,
            promisedSlugs: allPromised,
          }),
        ).toEqual(null);
      });
    });
  });
});
