import { given, then, when } from 'test-fns';

import type { StoneGuardLevelClearance } from './getStoneGuardLevelClearance';
import { getUnrunUnlockedLevels } from './getUnrunUnlockedLevels';

/**
 * .what = unit coverage for the unrun-unlocked-level detector
 * .why = this is the file-tally hole indicator; its "unlocked only" guard (a queued level BEHIND a
 *        live lower level is NOT the hole) must be pinned so a future edit cannot re-widen the hole.
 */
const level = (
  n: number,
  opts: { clearForUnlock: boolean; hasQueued: boolean },
): StoneGuardLevelClearance => ({
  level: n,
  overruled: false,
  clearForUnlock: opts.clearForUnlock,
  clearForPassage: false,
  hasQueued: opts.hasQueued,
});

/**
 * .what = the empty latch — no level has poured yet
 * .why = every pre-latch case must read exactly as it did before
 */
const NONE_POURED = new Set<number>();

describe('getUnrunUnlockedLevels', () => {
  given('[case1] l1 clear-for-unlock, l3 queued — unlocked AND unrun', () => {
    when('[t0] computed', () => {
      const result = getUnrunUnlockedLevels({
        levelClearance: [
          level(1, { clearForUnlock: true, hasQueued: false }),
          level(3, { clearForUnlock: true, hasQueued: true }),
        ],
        levelsPoured: NONE_POURED,
      });

      then('l3 is flagged as the unrun-unlocked level', () => {
        expect(result).toEqual([3]);
      });
    });
  });

  given(
    '[case2] l1 NOT clear-for-unlock, l3 queued — queued behind a live lower level',
    () => {
      when('[t0] computed', () => {
        const result = getUnrunUnlockedLevels({
          levelClearance: [
            level(1, { clearForUnlock: false, hasQueued: false }),
            level(3, { clearForUnlock: true, hasQueued: true }),
          ],
          levelsPoured: NONE_POURED,
        });

        then(
          'l3 is NOT flagged — the live l1 is the true blocker (C4 shape)',
          () => {
            expect(result).toEqual([]);
          },
        );
      });
    },
  );

  given('[case3] no level queued', () => {
    when('[t0] computed', () => {
      const result = getUnrunUnlockedLevels({
        levelClearance: [
          level(1, { clearForUnlock: true, hasQueued: false }),
          level(3, { clearForUnlock: true, hasQueued: false }),
        ],
        levelsPoured: NONE_POURED,
      });

      then('no level is flagged', () => {
        expect(result).toEqual([]);
      });
    });
  });

  /**
   * 🔴 .what = the LATCH reaches this judge too
   * .why = the latch WIDENS the gate, so a level it holds open is a level a queued
   *        reviewer must be reported against. were this consumer left un-latched, it
   *        would call l3 locked while the runner calls it open — and the stone would
   *        pass with a reviewer that never spoke (rule.forbid.failhide).
   */
  given('[case4] the latch — l3 poured, then l1 regressed', () => {
    when('[t0] a reviewer is queued at the latched l3', () => {
      const result = getUnrunUnlockedLevels({
        // 🔴 byte-for-byte case2's input, plus a pour on the record. case2 expects
        //    [] and this expects [3], so the latch is the sole variable under test
        levelClearance: [
          level(1, { clearForUnlock: false, hasQueued: false }),
          level(3, { clearForUnlock: true, hasQueued: true }),
        ],
        levelsPoured: new Set([3]),
      });

      then(
        'l3 IS flagged — the latch keeps it unlocked, so its queue is a gap',
        () => {
          expect(result).toEqual([3]);
        },
      );
    });
  });
});
