import { given, then, when } from 'test-fns';

import { asRealizedTokensFromReviewTokens } from './asRealizedTokensFromReviewTokens';
import { asReviewTokensFromRealized } from './asReviewTokensFromRealized';
import { getOneReviewTokensSummed } from './getOneReviewTokensSummed';

describe('getOneReviewTokensSummed', () => {
  given('[case1] two token records', () => {
    when('[t0] they are summed', () => {
      then('each axis sums apart', () => {
        expect(
          getOneReviewTokensSummed({
            tokens: [
              { input: 1, cacheSet: 2, cacheGet: 3, output: 4 },
              { input: 10, cacheSet: 20, cacheGet: 30, output: 40 },
            ],
          }),
        ).toEqual({ input: 11, cacheSet: 22, cacheGet: 33, output: 44 });
      });
    });
  });

  given('[case2] no token records', () => {
    when('[t0] they are summed', () => {
      const first = getOneReviewTokensSummed({ tokens: [] });
      const second = getOneReviewTokensSummed({ tokens: [] });

      then('the sum is zero on every axis', () => {
        expect(first).toEqual({
          input: 0,
          cacheSet: 0,
          cacheGet: 0,
          output: 0,
        });
      });

      then(
        'each empty fold hands back its own object, never a shared one',
        () => {
          expect(first).not.toBe(second);
        },
      );
    });
  });

  given('[case3] a realized record cast to the domain and back', () => {
    when('[t0] it round-trips', () => {
      then('every axis lands on its own disk name again', () => {
        const realized = {
          input: 5,
          inputCacheCreation: 6,
          inputCacheRead: 7,
          output: 8,
        };
        expect(
          asRealizedTokensFromReviewTokens({
            tokens: asReviewTokensFromRealized({ tokens: realized }),
          }),
        ).toEqual(realized);
      });
    });
  });
});
