/**
 * .what = whether a review level was overruled by the human — the atomic "is this level waved
 *         through" check: true when the level sits in `overruledLevels`. the judge is the top
 *         rung (JUDGE_LEVEL), so a judge overrule is just JUDGE_LEVEL in this set.
 * .why = this check was hand-written independently in ~4 places (the clearance primitive, the
 *        meter statuses, the overruled-slug filter, the passage gate). that is the exact drift
 *        risk this behavior exists to close — one place a change can land, so the consumers can
 *        never silently disagree on what "overruled" means (rule.require.single-source-of-truth-for-render).
 */
export const isLevelOverruled = (input: {
  level: number;
  overruledLevels: Set<number>;
}): boolean => input.overruledLevels.has(input.level);
