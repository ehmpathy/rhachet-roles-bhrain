import { given, then, when } from 'test-fns';

import { asHashbarDeclaredReviews } from './asHashbarDeclaredReviews';

describe('asHashbarDeclaredReviews', () => {
  given('[case1] a guard that declares hashbar: 0', () => {
    when('[t0] the notice roster is built', () => {
      then('the review is named', () => {
        // 🔴 .why = 0 was the commonest value in the wild, and a truthy test would drop
        //           exactly the author who most needs to hear the key is retired.
        //           swap `!== undefined` for a truthy check and this goes red
        expect(
          asHashbarDeclaredReviews({
            stone: '1.vision',
            selfReviews: [{ slug: 'all-done', say: 'a', hashbar: 0 }],
          }),
        ).toEqual([{ stone: '1.vision', slug: 'all-done' }]);
      });
    });
  });

  given('[case2] a guard that declares a non-zero hashbar', () => {
    when('[t0] the notice roster is built', () => {
      then('the review is named', () => {
        expect(
          asHashbarDeclaredReviews({
            stone: '2.criteria',
            selfReviews: [{ slug: 'all-done', say: 'a', hashbar: 3 }],
          }),
        ).toEqual([{ stone: '2.criteria', slug: 'all-done' }]);
      });
    });
  });

  given('[case3] a guard that declares no hashbar', () => {
    when('[t0] the notice roster is built', () => {
      then('it is empty, so no notice renders', () => {
        // .why = no guard in this repo sets the key, so the common path is silence
        expect(
          asHashbarDeclaredReviews({
            stone: '1.vision',
            selfReviews: [{ slug: 'all-done', say: 'a' }],
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case4] a mix of declared and undeclared', () => {
    when('[t0] the notice roster is built', () => {
      then('only the declared are named, in source order', () => {
        expect(
          asHashbarDeclaredReviews({
            stone: '1.vision',
            selfReviews: [
              { slug: 'first', say: 'a' },
              { slug: 'second', say: 'b', hashbar: 0 },
              { slug: 'third', say: 'c' },
              { slug: 'fourth', say: 'd', hashbar: 9 },
            ],
          }),
        ).toEqual([
          { stone: '1.vision', slug: 'second' },
          { stone: '1.vision', slug: 'fourth' },
        ]);
      });
    });
  });
});
