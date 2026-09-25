import { given, then, when } from 'test-fns';

import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

import { findNextUnpromisedReview } from './findNextUnpromisedReview';
import { getSelfReviewIndex } from './getSelfReviewIndex';

const asReviews = (slugs: string[]): RouteStoneGuardReviewSelf[] =>
  slugs.map((slug) => ({ slug })) as RouteStoneGuardReviewSelf[];

describe('findNextUnpromisedReview', () => {
  given('[case1] a stone with three self reviews, none promised', () => {
    const selfReviews = asReviews(['alpha', 'bravo', 'charlie']);

    when('[t0] the next unpromised is found', () => {
      const result = findNextUnpromisedReview({
        selfReviews,
        promisedSlugs: new Set<string>(),
      });

      then('it names the first', () => {
        expect(result?.reviewSelf.slug).toEqual('alpha');
      });

      /**
       * .why = the index renders straight into `review.self N/M`, which a driver reads as
       *        "this is lane N". a zero-based offset there would print `0/3` for the very
       *        first lane — an off-by-one visible on the first command of every stone.
       */
      then('the index is 1-based, never an offset', () => {
        expect(result?.index).toEqual(1);
      });
    });
  });

  given('[case2] the first review is already promised', () => {
    const selfReviews = asReviews(['alpha', 'bravo', 'charlie']);

    when('[t0] the next unpromised is found', () => {
      const result = findNextUnpromisedReview({
        selfReviews,
        promisedSlugs: new Set(['alpha']),
      });

      then('it names the second', () => {
        expect(result?.reviewSelf.slug).toEqual('bravo');
      });

      /**
       * .why = this is the case that was broken, and it is the one a driver meets on every
       *        multi-review stone. the counter returned 1 here as well as for `alpha`, so the
       *        guard printed the SAME number for two DIFFERENT lanes and the progress the
       *        driver had just earned was invisible to them.
       */
      then('the counter ADVANCES — it does not repeat the prior lane', () => {
        expect(result?.index).toEqual(2);
      });
    });
  });

  given('[case3] the promises arrive out of the declared order', () => {
    const selfReviews = asReviews(['alpha', 'bravo', 'charlie']);

    when('[t0] the middle review is promised first (a fork)', () => {
      const result = findNextUnpromisedReview({
        selfReviews,
        promisedSlugs: new Set(['bravo']),
      });

      /**
       * .why = the hand-out lets a driver promise in any order, so the index must be a
       *        POSITION in the guard's declared list — never a count of what is promised.
       *        a count would report 1 here, which is the slot `alpha` already occupies.
       */
      then('the index is the position in the declared list', () => {
        expect(result?.reviewSelf.slug).toEqual('alpha');
        expect(result?.index).toEqual(1);
      });
    });
  });

  given('[case4] every review is promised', () => {
    const selfReviews = asReviews(['alpha', 'bravo']);

    when('[t0] the next unpromised is found', () => {
      then('it returns null', () => {
        expect(
          findNextUnpromisedReview({
            selfReviews,
            promisedSlugs: new Set(['alpha', 'bravo']),
          }),
        ).toEqual(null);
      });
    });
  });

  /**
   * .why = both operations answer "which position is this review?", and they render into the
   *        same `review.self N/M` line from two different call sites. they disagreed for a
   *        full release. this holds them to one convention so a future edit to either is
   *        caught here rather than by a driver who reads `1/8` twice.
   */
  given('[case5] the two operations that derive this quantity', () => {
    const selfReviews = asReviews(['alpha', 'bravo', 'charlie']);

    when('[t0] each derives the position of the same review', () => {
      then('they agree, for every review on the stone', () => {
        selfReviews.forEach((review, offset) => {
          const promisedSlugs = new Set(
            selfReviews.slice(0, offset).map((r) => r.slug),
          );
          expect(
            findNextUnpromisedReview({ selfReviews, promisedSlugs })?.index,
          ).toEqual(getSelfReviewIndex({ selfReviews, slug: review.slug }));
        });
      });
    });
  });
});
