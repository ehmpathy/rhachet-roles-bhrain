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
 */
export const isReviewLevelUnlocked = (input: {
  clearance: StoneGuardLevelClearance[];
  level: number;
}): boolean =>
  input.clearance
    .filter((entry) => entry.level < input.level)
    .every((entry) => entry.clearForUnlock);
