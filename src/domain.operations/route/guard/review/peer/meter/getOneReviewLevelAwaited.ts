import type { StoneGuardLevelClearance } from './getStoneGuardLevelClearance';

/**
 * .what = the lowest lower level that holds a review level shut, or null if none does
 * .why = a lane whose level never opened is shown as `awaits l<N> terminal` in the persisted
 *        guard tree. the live tree must name the same level, read off the same clearance ladder
 *        `isReviewLevelUnlocked` reads, so one lane never renders two ways in one stdout
 *        (rule.require.single-source-of-truth-for-render)
 */
export const getOneReviewLevelAwaited = (input: {
  clearance: StoneGuardLevelClearance[];
  level: number;
}): { level: number } | null => {
  // the lower levels that are not yet clear, lowest first
  const held = input.clearance
    .filter((entry) => entry.level < input.level && !entry.clearForUnlock)
    .map((entry) => entry.level)
    .sort((a, b) => a - b);

  // no lower level holds it
  const lowest = held[0];
  if (lowest === undefined) return null;
  return { level: lowest };
};
