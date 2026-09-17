import type { StoneGuardLevelClearance } from './getStoneGuardLevelClearance';

/**
 * .what = whether a review level is unlocked to run, read from the level-clearance ladder
 * .why = a higher level runs only once EVERY lower level is clear-for-unlock. this reads the
 *        shared `getStoneGuardLevelClearance` primitive (overrule as an explicit flag) instead
 *        of the old reviewers+overrule-as-filter path, so "can this review run" can never
 *        silently disagree with the ladder status / passage judge that read the same primitive
 *        (rule.require.single-source-of-truth-for-render).
 * .note = level 1 has no lower level, so it is always unlocked (the empty `.every` is true).
 * .note = a level absent from the ladder (no reviewers at it) contributes no entry, so it does
 *         not hold a higher level — the same "empty level = terminal" default the old gate had.
 *
 * 🔴 .the LATCH = a level that has already POURED stays unlocked, whatever the ladder now says
 *    (define.invariant.review.peer.level-unlock-is-a-latch).
 *
 *    .why = `clearance` is recomputed from scratch on every pass, so a lower level that read
 *           terminal once can read non-terminal later. the live case is a malfunctioned l1 that
 *           gets repaired and now rejects — and a malfunction spends no round, so it never
 *           exhausts into the budget-locked skip either. with no latch, l3 is withdrawn
 *           mid-conversation after it had already spoken.
 *
 *    ⚠️ the latch is read FIRST and short-circuits, so it can only ever WIDEN the gate, never
 *      narrow it. a level that has not poured falls through to the ordinary ladder read, byte
 *      for byte as before — which is what keeps every extant clamp honest.
 */
export const isReviewLevelUnlocked = (input: {
  clearance: StoneGuardLevelClearance[];
  level: number;
  /**
   * the levels that have already poured for this stone — the latch.
   *
   * .why = required rather than optional, so a caller cannot omit it and silently get the
   *        un-latched gate (rule.forbid.undefined-inputs). an empty set is the explicit
   *        "no level has poured yet" value.
   */
  levelsPoured: Set<number>;
}): boolean =>
  input.levelsPoured.has(input.level) ||
  input.clearance
    .filter((entry) => entry.level < input.level)
    .every((entry) => entry.clearForUnlock);
