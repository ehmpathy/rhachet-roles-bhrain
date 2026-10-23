import { given, then, when } from 'test-fns';

import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getOneNextUnpromisedReview } from './getOneNextUnpromisedReview';
import { getSelfReviewIndex } from './getSelfReviewIndex';

// note: a fixture cast — only `slug` is read by the two operations under test
const selfReviews = [
  { slug: 'has-alpha', say: 'alpha' },
  { slug: 'has-beta', say: 'beta' },
  { slug: 'has-gamma', say: 'gamma' },
] as unknown as RouteStoneGuardReviewSelf[];

describe('getOneNextUnpromisedReview', () => {
  given('[case1] no review promised yet', () => {
    when('[t0] the next review is found', () => {
      then('its index is 1-based, the first review is 1', () => {
        const result = getOneNextUnpromisedReview({
          selfReviews,
          promisedSlugs: new Set(),
        });
        expect(result?.reviewSelf.slug).toEqual('has-alpha');
        expect(result?.index).toEqual(1);
        expect(result?.total).toEqual(3);
      });
    });
  });

  given('[case2] the first two reviews promised', () => {
    when('[t0] the next review is found', () => {
      then(
        'its index equals the one the promise path computes, so the announced articulation path is the one the guard reads',
        () => {
          const result = getOneNextUnpromisedReview({
            selfReviews,
            promisedSlugs: new Set(['has-alpha', 'has-beta']),
          });
          expect(result?.reviewSelf.slug).toEqual('has-gamma');
          expect(result?.index).toEqual(
            getSelfReviewIndex({ selfReviews, slug: 'has-gamma' }),
          );
          expect(result?.index).toEqual(3);
        },
      );
    });
  });

  given('[case3] every review promised', () => {
    when('[t0] the next review is sought', () => {
      then('none is returned', () => {
        const result = getOneNextUnpromisedReview({
          selfReviews,
          promisedSlugs: new Set(['has-alpha', 'has-beta', 'has-gamma']),
        });
        expect(result).toBeNull();
      });
    });
  });
});
