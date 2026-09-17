import { getAllReviewLevelsAsc } from '../../getAllReviewLevelsAsc';
import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { getStoneGuardLevelClearance } from './getStoneGuardLevelClearance';

/**
 * .what = the highest review level present among the reviewers
 * .why = `forced` may only grant approval when the active level is the terminal
 *        (highest) level — approval before the top level is seen is illogical
 * .note = returns null when there are no reviewers
 */
export const computeReviewTerminalLevel = (
  reviewers: Array<{ level: number }>,
): number | null => {
  const levels = getAllReviewLevelsAsc({ peers: reviewers });
  return levels.length === 0 ? null : levels[levels.length - 1]!;
};

/**
 * .what = the current active level: the lowest level that still blocks passage
 * .why = overrule and force scope to the active level; this is the level a
 *        human unblocks when they run --as overruled / --as forced
 *
 * a level no longer blocks passage when either:
 * - every reviewer at the level is approved, or
 * - the level was overruled by a human
 *
 * .note = a malfunctioned or constrained level still BLOCKS passage (so it is
 *         active and overrule-able) even though it is terminal for tier
 *         escalation — these are distinct concerns.
 * .note = returns null when no level blocks passage (none left to overrule)
 */
export const computeReviewActiveLevel = (input: {
  reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }>;
  overruledLevels: Set<number>;
}): number | null => {
  // read per-level passage-clearance from the single-source primitive; its
  // clearForPassage folds in the overrule (overruled || every reviewer approved),
  // so the lowest level that is NOT clear-for-passage is the active level.
  const clearance = getStoneGuardLevelClearance({
    reviewers: input.reviewers,
    overruledLevels: input.overruledLevels,
  });
  const firstHeld = clearance.find((c) => !c.clearForPassage);
  return firstHeld?.level ?? null;
};
