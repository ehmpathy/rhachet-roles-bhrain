import { given, then, when } from 'test-fns';

import { asReviewProgressOutcome } from './asReviewProgressOutcome';

describe('asReviewProgressOutcome', () => {
  given('[case1] a review that passed', () => {
    when('[t0] the outcome is derived', () => {
      then('it carries the counts', () => {
        expect(
          asReviewProgressOutcome({
            exitClass: 'passed',
            exitCode: 0,
            blockers: 0,
            nitpicks: 3,
            stderr: '',
          }),
        ).toEqual({ blockers: 0, nitpicks: 3 });
      });
    });
  });

  given(
    '[case2] exit 2 WITH blockers — the review ran and found issues',
    () => {
      when('[t0] the outcome is derived', () => {
        then('it carries the counts, never a constraint message', () => {
          expect(
            asReviewProgressOutcome({
              exitClass: 'constraint',
              exitCode: 2,
              blockers: 4,
              nitpicks: 1,
              stderr: '',
            }),
          ).toEqual({ blockers: 4, nitpicks: 1 });
        });
      });
    },
  );

  given('[case3] exit 2 WITHOUT blockers — no verdict was rendered', () => {
    when('[t0] the outcome is derived', () => {
      then('it reads as a constraint, and names the exit code', () => {
        expect(
          asReviewProgressOutcome({
            exitClass: 'constraint',
            exitCode: 2,
            blockers: 0,
            nitpicks: 0,
            stderr: '',
          }),
        ).toEqual({
          constraint:
            'review returned constraint (exit code 2) without blockers',
        });
      });
    });
  });

  given('[case4] a malfunction whose stderr carries a cause', () => {
    when('[t0] the outcome is derived', () => {
      then('the lead line rides the message', () => {
        expect(
          asReviewProgressOutcome({
            exitClass: 'malfunction',
            exitCode: 1,
            blockers: 0,
            nitpicks: 0,
            stderr: '  🔐 keyrack: absent  \nstack line two\nstack line three',
          }),
        ).toEqual({
          malfunction:
            'review command failed with exit code 1. 🔐 keyrack: absent',
        });
      });
    });
  });

  given('[case5] a malfunction with empty stderr', () => {
    when('[t0] the outcome is derived', () => {
      then('it points the driver at the artifact', () => {
        expect(
          asReviewProgressOutcome({
            exitClass: 'malfunction',
            exitCode: 137,
            blockers: 0,
            nitpicks: 0,
            stderr: '',
          }),
        ).toEqual({
          malfunction:
            'review command failed with exit code 137. see review artifact for details',
        });
      });
    });
  });

  given('[case6] a malfunction whose stderr opens with a blank line', () => {
    // .why = `split('\n')[0]` yields '' here, which is falsy — so this clamps
    //        that the fallback fires rather than a message that ends in '. '
    when('[t0] the outcome is derived', () => {
      then('it falls back rather than emit an empty detail', () => {
        expect(
          asReviewProgressOutcome({
            exitClass: 'malfunction',
            exitCode: 1,
            blockers: 0,
            nitpicks: 0,
            stderr: '\nthe real cause is on line two',
          }),
        ).toEqual({
          malfunction:
            'review command failed with exit code 1. see review artifact for details',
        });
      });
    });
  });

  given('[case7] a malfunction that also reported blockers', () => {
    // .why = a malfunction outranks a count — the counts are unreadable if the
    //        process died, so they must never reach the render
    when('[t0] the outcome is derived', () => {
      then('the malfunction wins over the counts', () => {
        expect(
          asReviewProgressOutcome({
            exitClass: 'malfunction',
            exitCode: 1,
            blockers: 9,
            nitpicks: 9,
            stderr: 'boom',
          }),
        ).toEqual({
          malfunction: 'review command failed with exit code 1. boom',
        });
      });
    });
  });
});
