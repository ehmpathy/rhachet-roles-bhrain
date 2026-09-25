import { given, then, when } from 'test-fns';

import { asClearedTriggerTotal } from './asClearedTriggerTotal';

describe('asClearedTriggerTotal', () => {
  given('[case1] both marker kinds were cleared', () => {
    when('[t0] the total is asked for', () => {
      then('it sums the two kinds', () => {
        expect(asClearedTriggerTotal({ selfReviews: 3, blocked: 2 })).toEqual(
          5,
        );
      });
    });
  });

  given('[case2] one kind is absent', () => {
    when('[t0] only self-review markers were archived', () => {
      then('the total is that kind alone', () => {
        expect(asClearedTriggerTotal({ selfReviews: 4, blocked: 0 })).toEqual(
          4,
        );
      });
    });

    when('[t1] only a blocked marker was deleted', () => {
      then('the total is that kind alone', () => {
        expect(asClearedTriggerTotal({ selfReviews: 0, blocked: 1 })).toEqual(
          1,
        );
      });
    });
  });

  given('[case3] neither kind was cleared', () => {
    /**
     * .why = the rewind renders this number on EVERY cascade row, even the rows where it
     *        cleared no trigger at all. a total that read as absent or `NaN` there would
     *        print into a line a human reads.
     */
    when('[t0] the total is asked for', () => {
      then('it is zero, never absent', () => {
        expect(asClearedTriggerTotal({ selfReviews: 0, blocked: 0 })).toEqual(
          0,
        );
      });
    });
  });

  given('[case4] the two operands name distinct kinds', () => {
    when('[t0] the operands are swapped', () => {
      then('the sum is the same, so the names carry the distinction', () => {
        expect(asClearedTriggerTotal({ selfReviews: 7, blocked: 2 })).toEqual(
          asClearedTriggerTotal({ selfReviews: 2, blocked: 7 }),
        );
      });
    });

    when('[t1] one operand drops by one', () => {
      then('the total drops by one, whichever kind it was', () => {
        expect(asClearedTriggerTotal({ selfReviews: 6, blocked: 2 })).toEqual(
          8,
        );
        expect(asClearedTriggerTotal({ selfReviews: 7, blocked: 1 })).toEqual(
          8,
        );
      });
    });
  });
});
