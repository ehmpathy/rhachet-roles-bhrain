import { given, then, when } from 'test-fns';

import { asReviewRunDir } from './asReviewRunDir';

describe('asReviewRunDir', () => {
  given('[case1] a tree root and a run name', () => {
    when('[t0] the run dir is composed', () => {
      then('it sits under the tree review log root, by its name', () => {
        expect(
          asReviewRunDir({
            cwd: '/repo',
            name: '2026-10-06T00-00-00-000Z.pid1.aaa',
          }),
        ).toEqual('/repo/.log/bhrain/review/2026-10-06T00-00-00-000Z.pid1.aaa');
      });
    });
  });
});
