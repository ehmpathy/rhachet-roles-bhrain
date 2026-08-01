import { given, then, when } from 'test-fns';

import type { ReviewRun } from '../review/runOneReview';
import { asReviewVerdict } from './asReviewVerdict';

const asRun = (input: Partial<ReviewRun>): ReviewRun => ({
  stdout: '',
  stderr: '',
  exitCode: 0,
  durationMs: 1,
  blockers: 0,
  nitpicks: 0,
  tallier: 'deterministic',
  detected: true,
  ...input,
});

describe('asReviewVerdict', () => {
  given('[case1] a detected run with blockers', () => {
    const run = asRun({ detected: true, blockers: 2, nitpicks: 1 });

    when('[t0] mapped to a verdict', () => {
      then('outcome is rejected', () => {
        expect(asReviewVerdict({ run }).outcome).toEqual('rejected');
      });

      then('it carries the blocker + nitpick counts', () => {
        const verdict = asReviewVerdict({ run });
        expect(verdict.blockers).toEqual(2);
        expect(verdict.nitpicks).toEqual(1);
      });
    });
  });

  given('[case2] a detected run with nitpicks but no blockers', () => {
    const run = asRun({ detected: true, blockers: 0, nitpicks: 3 });

    when('[t0] mapped to a verdict', () => {
      then('outcome is passed — nitpicks alone do not reject', () => {
        expect(asReviewVerdict({ run }).outcome).toEqual('passed');
      });
    });
  });

  given('[case3] an undetected run with a stderr reason', () => {
    const run = asRun({
      detected: false,
      exitCode: 2,
      stderr: '\n✋ could not tally review\nmore detail',
    });

    when('[t0] mapped to a verdict', () => {
      then('outcome is malfunctioned, never a clean 0/0', () => {
        const verdict = asReviewVerdict({ run });
        expect(verdict.outcome).toEqual('malfunctioned');
        expect(verdict.tallier).toEqual(null);
      });

      then('reason is the first non-empty stderr line', () => {
        expect(asReviewVerdict({ run }).reason).toEqual(
          '✋ could not tally review',
        );
      });
    });
  });

  given('[case4] an undetected run with empty stderr', () => {
    const run = asRun({ detected: false, exitCode: 137, stderr: '' });

    when('[t0] mapped to a verdict', () => {
      then('reason falls back to the exit-code phrase', () => {
        expect(asReviewVerdict({ run }).reason).toEqual(
          'review exited 137 with no verdict',
        );
      });
    });
  });
});
