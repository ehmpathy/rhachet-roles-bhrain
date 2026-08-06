import { given, then, when } from 'test-fns';

import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { getStoneGuardLevelClearance } from './getStoneGuardLevelClearance';

/**
 * .what = unit coverage for the single-source level-clearance primitive
 * .why = every clearance consumer reads this; its unlock-vs-passage distinction and its
 *        overrule + queued cases must be pinned so a future edit cannot silently drift.
 */
const reviewer = (level: number, verdict: ReviewPeerVerdict) => ({
  level,
  verdict,
});

describe('getStoneGuardLevelClearance', () => {
  given('[case1] l1 approved, l3 approved — both clear for passage', () => {
    when('[t0] computed', () => {
      const clearance = getStoneGuardLevelClearance({
        reviewers: [reviewer(1, 'approved'), reviewer(3, 'approved')],
        overruledLevels: new Set(),
      });

      then('two levels, low-to-high', () => {
        expect(clearance.map((c) => c.level)).toEqual([1, 3]);
      });

      then('both are clear for unlock and passage, none queued', () => {
        expect(clearance.every((c) => c.clearForUnlock)).toEqual(true);
        expect(clearance.every((c) => c.clearForPassage)).toEqual(true);
        expect(clearance.every((c) => !c.hasQueued)).toEqual(true);
      });
    });
  });

  given(
    '[case2] l1 malfunction — clear for unlock but NOT for passage (the key distinction)',
    () => {
      when('[t0] computed', () => {
        const clearance = getStoneGuardLevelClearance({
          reviewers: [reviewer(1, 'malfunction')],
          overruledLevels: new Set(),
        });

        then('l1 is clear for unlock (a higher level may run)', () => {
          expect(clearance[0]!.clearForUnlock).toEqual(true);
        });

        then(
          'l1 is NOT clear for passage (a broken reviewer still blocks)',
          () => {
            expect(clearance[0]!.clearForPassage).toEqual(false);
          },
        );
      });
    },
  );

  given('[case3] l1 overruled — clear for both, never queued', () => {
    when('[t0] computed with l1 in overruledLevels', () => {
      const clearance = getStoneGuardLevelClearance({
        reviewers: [reviewer(1, 'rejected'), reviewer(3, 'approved')],
        overruledLevels: new Set([1]),
      });

      then(
        'l1 (raw rejected) reads clear for unlock AND passage via overrule',
        () => {
          const l1 = clearance.find((c) => c.level === 1)!;
          expect(l1.overruled).toEqual(true);
          expect(l1.clearForUnlock).toEqual(true);
          expect(l1.clearForPassage).toEqual(true);
          expect(l1.hasQueued).toEqual(false);
        },
      );
    });
  });

  given('[case4] every level overruled explicitly — all waved through', () => {
    when('[t0] computed with each level in overruledLevels', () => {
      const clearance = getStoneGuardLevelClearance({
        reviewers: [reviewer(1, 'rejected'), reviewer(3, 'queued')],
        overruledLevels: new Set([1, 3]),
      });

      then('all levels are overruled + clear, none flagged queued', () => {
        expect(clearance.every((c) => c.overruled)).toEqual(true);
        expect(clearance.every((c) => c.clearForPassage)).toEqual(true);
        expect(clearance.every((c) => !c.hasQueued)).toEqual(true);
      });
    });
  });

  given(
    '[case5] l1 overruled, l3 queued (unrun) — the file-tally hole indicator fires',
    () => {
      when('[t0] computed', () => {
        const clearance = getStoneGuardLevelClearance({
          reviewers: [reviewer(1, 'rejected'), reviewer(3, 'queued')],
          overruledLevels: new Set([1]),
        });

        then('l3 is NOT clear for passage and IS flagged queued', () => {
          const l3 = clearance.find((c) => c.level === 3)!;
          expect(l3.clearForPassage).toEqual(false);
          expect(l3.hasQueued).toEqual(true);
        });

        then('l1 (overruled) is not flagged queued', () => {
          const l1 = clearance.find((c) => c.level === 1)!;
          expect(l1.hasQueued).toEqual(false);
        });
      });
    },
  );

  given('[case6] l1 exhausted — terminal for unlock, not for passage', () => {
    when('[t0] computed', () => {
      const clearance = getStoneGuardLevelClearance({
        reviewers: [reviewer(1, 'exhausted')],
        overruledLevels: new Set(),
      });

      then('clear for unlock, not for passage', () => {
        expect(clearance[0]!.clearForUnlock).toEqual(true);
        expect(clearance[0]!.clearForPassage).toEqual(false);
      });
    });
  });

  given('[case7] l1 constraint — terminal for unlock, not for passage', () => {
    when('[t0] computed', () => {
      const clearance = getStoneGuardLevelClearance({
        reviewers: [reviewer(1, 'constraint')],
        overruledLevels: new Set(),
      });

      then(
        'clear for unlock, not for passage (the 4th terminal verdict, pinned)',
        () => {
          expect(clearance[0]!.clearForUnlock).toEqual(true);
          expect(clearance[0]!.clearForPassage).toEqual(false);
        },
      );
    });
  });
});
