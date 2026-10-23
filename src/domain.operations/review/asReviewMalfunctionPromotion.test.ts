import { given, then, when } from 'test-fns';

import { asReviewMalfunctionPromotion } from './asReviewMalfunctionPromotion';

describe('asReviewMalfunctionPromotion', () => {
  given('[case1] an exit-0 run whose verdict was read', () => {
    when('[t0] it is promoted', () => {
      then('it passes through untouched', () => {
        const result = asReviewMalfunctionPromotion({
          exitCode: 0,
          stderr: 'a warn line',
          detected: true,
          brainErrorReason: null,
        });
        expect(result).toEqual({ exitCode: 0, stderr: 'a warn line' });
      });
    });
  });

  given('[case2] a run that already failed, with no verdict', () => {
    when('[t0] it is promoted', () => {
      then('it keeps its own exit and stderr', () => {
        const result = asReviewMalfunctionPromotion({
          exitCode: 2,
          stderr: 'the child refused',
          detected: false,
          brainErrorReason: null,
        });
        expect(result).toEqual({ exitCode: 2, stderr: 'the child refused' });
      });
    });
  });

  given(
    '[case3] an exit-0 run with no readable verdict, no brain fault',
    () => {
      when('[t0] it is promoted', () => {
        const result = asReviewMalfunctionPromotion({
          exitCode: 0,
          stderr: '',
          detected: false,
          brainErrorReason: null,
        });

        then('it exits 1', () => {
          expect(result.exitCode).toEqual(1);
        });

        then('the stderr names the absent count and the contract', () => {
          expect(result.stderr).toContain(
            '💥 MalfunctionError: reviewer output lacks a numeric blocker/nitpick count',
          );
          expect(result.stderr).toContain('contract.reviewer-output.md');
        });
      });
    },
  );

  given(
    '[case4] an exit-0 run with no verdict, and a brain fault reason',
    () => {
      when('[t0] it is promoted', () => {
        const result = asReviewMalfunctionPromotion({
          exitCode: 0,
          stderr: 'a prior line',
          detected: false,
          brainErrorReason:
            '💥 MalfunctionError: review tally fallback timed out',
        });

        then('the brain fault reason wins over the no-count reason', () => {
          expect(result.exitCode).toEqual(1);
          expect(result.stderr).toEqual(
            'a prior line\n💥 MalfunctionError: review tally fallback timed out',
          );
          expect(result.stderr).not.toContain('lacks a numeric');
        });
      });
    },
  );
});
