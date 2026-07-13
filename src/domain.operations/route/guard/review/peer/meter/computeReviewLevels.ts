import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';

/**
 * .what = lists the distinct review levels present, sorted low-to-high
 * .why = level math (active, terminal) needs the ordered set of levels
 */
const getDistinctLevels = (reviewers: Array<{ level: number }>): number[] => {
  const levels = new Set<number>();
  for (const reviewer of reviewers) levels.add(reviewer.level);
  return [...levels].sort((a, b) => a - b);
};

/**
 * .what = checks if a level is clear for passage (every reviewer approved)
 * .why = the active level (what overrule targets) is the lowest level that
 *        still blocks final passage — a stricter notion than
 *        isReviewPeerLevelTerminal (which gates tier escalation).
 *
 * .note = malfunction, constraint, rejected, exhausted, queued all BLOCK
 *         passage even though malfunction/constraint are terminal for
 *         escalation. only an approved verdict clears a level for passage.
 */
const isReviewLevelClearForPassage = (input: {
  reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }>;
  level: number;
}): boolean => {
  const atLevel = input.reviewers.filter((r) => r.level === input.level);
  if (atLevel.length === 0) return true; // empty level = no blocker
  return atLevel.every((r) => r.verdict === 'approved');
};

/**
 * .what = the highest review level present among the reviewers
 * .why = `forced` may only grant approval when the active level is the terminal
 *        (highest) level — approval before the top level is seen is illogical
 * .note = returns null when there are no reviewers
 */
export const computeReviewTerminalLevel = (
  reviewers: Array<{ level: number }>,
): number | null => {
  const levels = getDistinctLevels(reviewers);
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
  const levels = getDistinctLevels(input.reviewers);

  // find the lowest level that still blocks passage and is not overruled
  for (const level of levels) {
    if (input.overruledLevels.has(level)) continue;
    if (isReviewLevelClearForPassage({ reviewers: input.reviewers, level }))
      continue;
    return level;
  }

  // no level blocks passage
  return null;
};
