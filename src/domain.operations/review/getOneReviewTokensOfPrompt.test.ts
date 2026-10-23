import { given, then, when } from 'test-fns';

import { getOneReviewTokensOfPrompt } from './getOneReviewTokensOfPrompt';

describe('getOneReviewTokensOfPrompt', () => {
  given('[case1] an ask with every axis nonzero', () => {
    when('[t0] its prompt figure is read', () => {
      then('it sums the input, cache set, and cache get axes', () => {
        expect(
          getOneReviewTokensOfPrompt({
            tokens: { input: 100, cacheSet: 20, cacheGet: 3, output: 7000 },
          }),
        ).toEqual(123);
      });
    });
  });

  given('[case2] an ask whose prompt was all cache reads', () => {
    when('[t0] its prompt figure is read', () => {
      then('output never leaks into the prompt figure', () => {
        expect(
          getOneReviewTokensOfPrompt({
            tokens: { input: 0, cacheSet: 0, cacheGet: 500, output: 9 },
          }),
        ).toEqual(500);
      });
    });
  });
});
