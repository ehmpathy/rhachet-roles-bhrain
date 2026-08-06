import type { StoneGuardLevelClearance } from './getStoneGuardLevelClearance';
import { isReviewLevelUnlocked } from './isReviewLevelUnlocked';

/**
 * .what = the levels that are UNLOCKED (every lower level clear-for-unlock) yet still hold an
 *         unrun (queued) reviewer — the ready-but-unproven higher levels a passage must block on.
 * .why = a queued reviewer writes no review file, so the judge's file tally cannot see it; this
 *        derives the gap the tally is blind to, so passage blocks a ready higher level rather than
 *        a silent pass (define.invariant.review.peer.passage: pass ⟺ every peer guard terminal).
 * .note = a level queued BEHIND a still-live lower level is normal ladder order, not the hole —
 *         that lower level's own review file already blocks the tally. so "unlocked" (every lower
 *         level clear-for-unlock) is the precise guard that keeps C4's "l1 blocks" from a read as
 *         "l3 queued". the unlocked test reads isReviewLevelUnlocked — the SAME ladder primitive
 *         the run-gate reads — so this can never disagree with it (single-source-of-truth).
 */
export const getUnrunUnlockedLevels = (input: {
  levelClearance: StoneGuardLevelClearance[];
}): number[] =>
  input.levelClearance
    .filter(
      (level) =>
        level.hasQueued &&
        isReviewLevelUnlocked({
          clearance: input.levelClearance,
          level: level.level,
        }),
    )
    .map((level) => level.level);
