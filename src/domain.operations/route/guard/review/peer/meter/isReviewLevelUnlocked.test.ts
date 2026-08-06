import { given, then, when } from 'test-fns';

import type { StoneGuardLevelClearance } from './getStoneGuardLevelClearance';
import { isReviewLevelUnlocked } from './isReviewLevelUnlocked';

/**
 * .what = unit coverage for the clearance-based level-unlock gate
 * .why = this replaces the old reviewers+overrule-as-filter unlock path; it must read "unlocked"
 *        as "every LOWER level is clear-for-unlock" (NOT "this level itself is clear") so a ready
 *        higher level still runs once its lower levels clear.
 */
const clear = (
  level: number,
  clearForUnlock: boolean,
): StoneGuardLevelClearance => ({
  level,
  overruled: false,
  clearForUnlock,
  clearForPassage: false,
  hasQueued: false,
});

describe('isReviewLevelUnlocked', () => {
  given('[case1] level 1 — no lower level', () => {
    when('[t0] l1 not clear, l3 present', () => {
      then('l1 is always unlocked (no lower level to hold it)', () => {
        const clearance = [clear(1, false), clear(3, false)];
        expect(isReviewLevelUnlocked({ clearance, level: 1 })).toBe(true);
      });
    });
  });

  given('[case2] l1 clear-for-unlock, l3 queued', () => {
    when('[t0] the lower level l1 is clear', () => {
      then('l3 is unlocked — even though l3 itself is not clear', () => {
        // the crux: unlock reads the LOWER levels, not the target level itself
        const clearance = [clear(1, true), clear(3, false)];
        expect(isReviewLevelUnlocked({ clearance, level: 3 })).toBe(true);
      });
    });
  });

  given('[case3] l1 NOT clear-for-unlock, l3 queued', () => {
    when('[t0] the lower level l1 still holds', () => {
      then('l3 is locked — the live l1 blocks the unlock', () => {
        const clearance = [clear(1, false), clear(3, false)];
        expect(isReviewLevelUnlocked({ clearance, level: 3 })).toBe(false);
      });
    });
  });

  given(
    '[case4] a level absent from the ladder does not hold a higher level',
    () => {
      when('[t0] only l1 and l3 present, target l3', () => {
        then(
          'the absent l2 contributes no entry, so l3 unlocks on l1 alone',
          () => {
            const clearance = [clear(1, true), clear(3, false)];
            expect(isReviewLevelUnlocked({ clearance, level: 3 })).toBe(true);
          },
        );
      });
    },
  );
});
