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

describe('getUnrunUnlockedLevels', () => {
  given('[case1] l1 clear-for-unlock, l3 queued — unlocked AND unrun', () => {
    when('[t0] computed', () => {
      const result = getUnrunUnlockedLevels({
        levelClearance: [
          level(1, { clearForUnlock: true, hasQueued: false }),
          level(3, { clearForUnlock: true, hasQueued: true }),
        ],
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
      });

      then('no level is flagged', () => {
        expect(result).toEqual([]);
      });
    });
  });
});
