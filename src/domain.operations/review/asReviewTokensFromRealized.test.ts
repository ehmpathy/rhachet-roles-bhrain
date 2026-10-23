import { asReviewTokensFromRealized } from './asReviewTokensFromRealized';

describe('asReviewTokensFromRealized', () => {
  test('maps each disk axis onto its domain axis, none swapped', () => {
    // a distinct value per axis, so a swapped cacheSet/cacheGet map fails here
    expect(
      asReviewTokensFromRealized({
        tokens: {
          input: 1,
          inputCacheCreation: 20,
          inputCacheRead: 300,
          output: 4000,
        },
      }),
    ).toEqual({ input: 1, cacheSet: 20, cacheGet: 300, output: 4000 });
  });
});
