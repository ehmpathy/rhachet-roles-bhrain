import { given, then, when } from 'test-fns';

import { computeReviewCompleted } from './computeReviewCompleted';
import { asPeerGivenVerdict } from './peer/asPeerGivenVerdict';

/**
 * .what = unit cases for the rule the METER charges a round on
 * .why = 🔴 a round is what the budget bounds, and a top-up past that bound is what this
 *        behavior refuses. so a lane that is charged for a review it never ran runs dry early
 *        and asks for a grant it should never have needed — the meter's own version of the
 *        lever the gate exists to hold.
 *
 * 🔴 [case4] pins the TWIN. an unreadable review counts 0 here and 1 at the passage gate, and a
 *    future edit that made the two "consistent" would break whichever it did not have in view.
 *    the divergence is asserted rather than left to two docblocks that promise each other.
 */
describe('computeReviewCompleted', () => {
  given('[case1] the reviewer ran and spoke — exit 0', () => {
    when('[t0] the meter asks whether to charge', () => {
      then('the round is charged', () => {
        expect(
          computeReviewCompleted({ exitClass: 'passed', blockers: 0 }),
        ).toBe(true);
      });
    });
  });

  given(
    '[case2] the reviewer ran and found issues — exit 2 with blockers',
    () => {
      when('[t0] the meter asks whether to charge', () => {
        then('the round is charged', () => {
          expect(
            computeReviewCompleted({ exitClass: 'constraint', blockers: 3 }),
          ).toBe(true);
        });
      });
    },
  );

  given('[case3] a genuine constraint — exit 2, no blockers', () => {
    // an absent api key is not a review. req 6 of the wish: a broken lane is not an
    // exhausted one, so its repair must never need a grant.
    when('[t0] the meter asks whether to charge', () => {
      then('NO round is charged', () => {
        expect(
          computeReviewCompleted({ exitClass: 'constraint', blockers: 0 }),
        ).toBe(false);
      });
    });
  });

  given('[case4] an UNREADABLE review — the two seats, read together', () => {
    // `runOneReview` zeroes an undetected count AND promotes an exit-0 undetected review to
    // exit 1, so an unreadable review reaches the meter on one of these two rows.
    when('[t0] it exited 0, so it was promoted to a malfunction', () => {
      then('NO round is charged', () => {
        expect(
          computeReviewCompleted({ exitClass: 'malfunction', blockers: 0 }),
        ).toBe(false);
      });
    });

    when('[t1] it exited 2, so it lands as a blocker-less constraint', () => {
      then('NO round is charged', () => {
        expect(
          computeReviewCompleted({ exitClass: 'constraint', blockers: 0 }),
        ).toBe(false);
      });
    });

    when('[t2] the PASSAGE gate reads the same unreadable review', () => {
      // 🔴 the twin, asserted. the passage gate fabricates a blocker so a stone cannot pass
      //    on a verdict nobody read — the opposite number, for the opposite question.
      then('it carries ONE blocker, flagged fabricated', () => {
        expect(asPeerGivenVerdict({ counts: { detected: false } })).toEqual({
          blockers: 1,
          nitpicks: 0,
          unreadable: true,
        });
      });

      then('the two seats DISAGREE, and that is the design', () => {
        const verdict = asPeerGivenVerdict({ counts: { detected: false } });
        expect(verdict.blockers).toEqual(1);
        expect(
          computeReviewCompleted({
            exitClass: 'malfunction',
            blockers: 0,
          }),
        ).toBe(false);
      });
    });
  });

  given('[case5] a malfunction that somehow carries blockers', () => {
    // the magnitude never rescues a malfunction — only `passed` or a real constraint charges
    when('[t0] the meter asks whether to charge', () => {
      then('NO round is charged', () => {
        expect(
          computeReviewCompleted({ exitClass: 'malfunction', blockers: 9 }),
        ).toBe(false);
      });
    });
  });
});
