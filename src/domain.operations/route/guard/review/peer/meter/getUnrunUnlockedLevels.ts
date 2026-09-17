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
 *
 * 🔴 .why `levelsPoured` is threaded here too = the latch WIDENS the gate, so a level it holds
 *    open is a level a queued reviewer must be reported against. omit it and the two consumers
 *    of one predicate drift apart at exactly the case the latch creates: l3 latched open, l1
 *    regressed to a rejection, a reviewer newly enrolled at l3 left queued. the run-gate would
 *    run it; this judge, on the un-latched read, would call l3 locked and report no gap — so the
 *    stone passes with a reviewer that never spoke, which is the `rule.forbid.failhide` shape
 *    `define.invariant.review.peer.passage` exists to refuse.
 */
export const getUnrunUnlockedLevels = (input: {
  levelClearance: StoneGuardLevelClearance[];
  /**
   * the levels already poured — the latch (define.invariant.review.peer.level-unlock-is-a-latch).
   *
   * .why = required, never optional, so a caller cannot omit it and silently read the
   *        un-latched gate while the runner reads the latched one (rule.forbid.undefined-inputs).
   */
  levelsPoured: Set<number>;
}): number[] =>
  input.levelClearance
    .filter(
      (level) =>
        level.hasQueued &&
        isReviewLevelUnlocked({
          clearance: input.levelClearance,
          level: level.level,
          levelsPoured: input.levelsPoured,
        }),
    )
    .map((level) => level.level);
