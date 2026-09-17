import { given, then, when } from 'test-fns';

import { isLaneSkippedByDispute } from './isLaneSkippedByDispute';

/**
 * .what = unit clamp for the one predicate that makes acceptance #2 true — a disputed lane
 *         goes quiet ONLY when its residual clears the threshold
 * .why = this is the single place "the disagreement consumes no budget" is decided. a regression
 *        that (i) never skips spends a round to re-raise a settled point, or (ii) always skips
 *        silences a lane whose residual still holds the road (`case=4`'s F024). both would ship
 *        green with no clamp, so the red-then-green test is owed here (rule.require.clamp-edge-cases).
 */
describe('isLaneSkippedByDispute', () => {
  given('[case1] a lane that never spoke — no cachedReview', () => {
    when('[t0] the predicate is asked', () => {
      then('it runs — there is no prior verdict for a stance to answer', () => {
        expect(
          isLaneSkippedByDispute({
            cachedReview: null,
            disputed: { blockers: 1, nitpicks: 0 },
            allowBlockers: 0,
            allowNitpicks: 7,
          }),
        ).toBe(false);
      });
    });
  });

  given('[case2] a lane that spoke, with no dispute declared', () => {
    when('[t0] the predicate is asked', () => {
      then('it runs — a lane with no stance is never skipped', () => {
        expect(
          isLaneSkippedByDispute({
            cachedReview: { blockers: 1, nitpicks: 2 },
            disputed: { blockers: 0, nitpicks: 0 },
            allowBlockers: 0,
            allowNitpicks: 7,
          }),
        ).toBe(false);
      });
    });
  });

  given('[case3] one blocker, disputed, residual clears the threshold', () => {
    when('[t0] the predicate is asked', () => {
      then('it skips — the residual no longer holds the road', () => {
        expect(
          isLaneSkippedByDispute({
            cachedReview: { blockers: 1, nitpicks: 0 },
            disputed: { blockers: 1, nitpicks: 0 },
            allowBlockers: 0,
            allowNitpicks: 7,
          }),
        ).toBe(true);
      });
    });
  });

  given(
    '[case4] three blockers, one disputed — residual still holds the road (F024)',
    () => {
      when('[t0] the predicate is asked', () => {
        then('it runs — a live critic must still speak', () => {
          expect(
            isLaneSkippedByDispute({
              cachedReview: { blockers: 3, nitpicks: 0 },
              disputed: { blockers: 1, nitpicks: 0 },
              allowBlockers: 0,
              allowNitpicks: 7,
            }),
          ).toBe(false);
        });
      });
    },
  );

  given(
    '[case5] eight nitpicks over a threshold of seven, two disputed',
    () => {
      when('[t0] the predicate is asked', () => {
        then('it skips — residual six clears the seven allowance', () => {
          expect(
            isLaneSkippedByDispute({
              cachedReview: { blockers: 0, nitpicks: 8 },
              disputed: { blockers: 0, nitpicks: 2 },
              allowBlockers: 0,
              allowNitpicks: 7,
            }),
          ).toBe(true);
        });
      });
    },
  );

  given(
    '[case6] ten nitpicks, one disputed — residual still over the allowance',
    () => {
      when('[t0] the predicate is asked', () => {
        then('it runs — the nitpick residual holds the road', () => {
          expect(
            isLaneSkippedByDispute({
              cachedReview: { blockers: 0, nitpicks: 10 },
              disputed: { blockers: 0, nitpicks: 1 },
              allowBlockers: 0,
              allowNitpicks: 7,
            }),
          ).toBe(false);
        });
      });
    },
  );
});
