import { given, then, when } from 'test-fns';

import { genReviewGroveProgressLine } from '@src/domain.operations/review/grove/genReviewGroveProgressLine';

/**
 * .what = unit tests for the one-line render of a grove-walk progress event
 * .why = the line is the ONLY output a human sees across a minutes-long walk, so its
 *        shape is a contract with that human, never an implementation detail
 */
describe('genReviewGroveProgressLine', () => {
  given('[case1] the walk stage, whose total is unknowable ahead of it', () => {
    when('[t0] the line is rendered', () => {
      const line = genReviewGroveProgressLine({
        progress: {
          stage: 'walk',
          done: 41,
          total: null,
          detail: '41 trees · 12 carry review logs',
        },
      });

      then('it renders no counter, because there is no denominator', () => {
        // a `41/null` or a `41/41` here would either be unreadable or claim a
        // denominator nobody measured — the exact defect the whole meter exists to
        // refuse, one layer down
        expect(line).not.toContain('/');
      });

      then('it opens a branch, never closes one', () => {
        expect(line).toContain('├─');
        expect(line).not.toContain('└─');
      });

      then('it reads as a fact in the past tense', () => {
        expect(line).toEqual('   ├─ walked 41 trees · 12 carry review logs');
      });
    });
  });

  given('[case2] the mine stage, which knows its denominator', () => {
    when('[t0] the line is rendered mid-walk', () => {
      const line = genReviewGroveProgressLine({
        progress: {
          stage: 'mine',
          done: 3,
          total: 12,
          detail: 'repo.beav.feat-demo · 49 runs',
        },
      });

      then(
        'it carries the counter, so a reader can see how far is left',
        () => {
          expect(line).toEqual(
            '   ├─ mined 3/12 · repo.beav.feat-demo · 49 runs',
          );
        },
      );
    });
  });

  given('🔴 [case3] the fold stage, which is LAST by construction', () => {
    when('[t0] the line is rendered', () => {
      const line = genReviewGroveProgressLine({
        progress: {
          stage: 'fold',
          done: 318,
          total: null,
          detail: '318 runs priced',
        },
      });

      then('🔴 it CLOSES the treestruct', () => {
        // the render is STREAMED, so it cannot look ahead to learn which line is
        // last. the closure rides on the stage instead — and this is what goes red
        // if a fourth stage is ever appended after `fold` without a re-think
        // (rule.require.treestruct-output)
        expect(line).toContain('└─');
        expect(line).not.toContain('├─');
      });

      then('it reads as the summary of the whole walk', () => {
        expect(line).toEqual('   └─ folded 318 runs priced');
      });
    });
  });
});
