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

/**
 * .what = the empty latch — no level has poured yet
 * .why = every pre-latch case must read exactly as it did before, so this is the
 *        explicit "none poured" value rather than an omitted input
 */
const NONE_POURED = new Set<number>();

describe('isReviewLevelUnlocked', () => {
  given('[case1] level 1 — no lower level', () => {
    when('[t0] l1 not clear, l3 present', () => {
      then('l1 is always unlocked (no lower level to hold it)', () => {
        const clearance = [clear(1, false), clear(3, false)];
        expect(
          isReviewLevelUnlocked({
            clearance,
            level: 1,
            levelsPoured: NONE_POURED,
          }),
        ).toBe(true);
      });
    });
  });

  given('[case2] l1 clear-for-unlock, l3 queued', () => {
    when('[t0] the lower level l1 is clear', () => {
      then('l3 is unlocked — even though l3 itself is not clear', () => {
        // the crux: unlock reads the LOWER levels, not the target level itself
        const clearance = [clear(1, true), clear(3, false)];
        expect(
          isReviewLevelUnlocked({
            clearance,
            level: 3,
            levelsPoured: NONE_POURED,
          }),
        ).toBe(true);
      });
    });
  });

  given('[case3] l1 NOT clear-for-unlock, l3 queued', () => {
    when('[t0] the lower level l1 still holds', () => {
      then('l3 is locked — the live l1 blocks the unlock', () => {
        const clearance = [clear(1, false), clear(3, false)];
        expect(
          isReviewLevelUnlocked({
            clearance,
            level: 3,
            levelsPoured: NONE_POURED,
          }),
        ).toBe(false);
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
            expect(
              isReviewLevelUnlocked({
                clearance,
                level: 3,
                levelsPoured: NONE_POURED,
              }),
            ).toBe(true);
          },
        );
      });
    },
  );

  /**
   * 🔴 .what = the LATCH — define.invariant.review.peer.level-unlock-is-a-latch
   * .why = the ladder is recomputed every pass, so a lower level that read terminal
   *        once can read non-terminal later. absent the latch, a higher level that
   *        already spoke is withdrawn mid-conversation.
   */
  given('[case5] the latch — l3 has already poured', () => {
    when('[t0] l1 has since regressed to NOT clear-for-unlock', () => {
      then('l3 stays unlocked — the latch holds its door open', () => {
        // 🔴 the exact state case3 proves is LOCKED, plus a pour on the record.
        //    the only difference between the two is the latch, so this pins the
        //    latch itself rather than any property of the ladder
        const clearance = [clear(1, false), clear(3, false)];
        expect(
          isReviewLevelUnlocked({
            clearance,
            level: 3,
            levelsPoured: new Set([3]),
          }),
        ).toBe(true);
      });
    });

    when('[t1] a DIFFERENT level is on the latch', () => {
      then('l3 stays locked — the latch is per level, never stone-wide', () => {
        // ⚠️ .why = a latch that leaked across levels would unlock every level the
        //    moment any one poured, which is the ladder deleted rather than latched
        const clearance = [clear(1, false), clear(3, false)];
        expect(
          isReviewLevelUnlocked({
            clearance,
            level: 3,
            levelsPoured: new Set([1]),
          }),
        ).toBe(false);
      });
    });
  });

  given('[case6] the latch only ever WIDENS the gate', () => {
    when('[t0] l1 is clear and l3 is on the latch', () => {
      then('l3 is unlocked — as it would have been either way', () => {
        // .why = the latch short-circuits FIRST, so it can never turn a true into a
        //        false. this pins that direction, which is what keeps every extant
        //        clamp in this suite honest under the new input
        const clearance = [clear(1, true), clear(3, false)];
        expect(
          isReviewLevelUnlocked({
            clearance,
            level: 3,
            levelsPoured: new Set([3]),
          }),
        ).toBe(true);
      });
    });
  });
});
