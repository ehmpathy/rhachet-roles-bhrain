import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { isLevelOverruled } from './isLevelOverruled';
import { isReviewPeerVerdictTerminal } from './isReviewPeerVerdictTerminal';

/**
 * .what = the clearance state of ONE review level, from its reviewers + human overrules
 * .why = "is this level clear" was re-derived ~6 times across the guard with subtly
 *        different shapes (a filter-then-check here, an inline every() there, a
 *        regex-parsed file tally elsewhere) — and they drifted, which is what produced
 *        the persisted-tree-vs-live-render contradiction this behavior had to fix. this
 *        is the single source of truth those consumers read
 *        (rule.require.single-source-of-truth-for-render).
 */
export interface StoneGuardLevelClearance {
  /** the review level (1-based, low = cheaper/earlier) */
  level: number;
  /** the human waved this whole level through (this level in overruledLevels) */
  overruled: boolean;
  /**
   * clear-for-UNLOCK: this level no longer holds a HIGHER level from a run. true when the
   * level is overruled, or every reviewer at it is terminal (approved | exhausted | malfunction
   * | constraint). this is the tier-escalation gate — a malfunctioned/constrained level unlocks
   * the next even though it still blocks passage.
   */
  clearForUnlock: boolean;
  /**
   * clear-for-PASSAGE: this level does not block the stone from passage. true when the level is
   * overruled, or every reviewer at it is approved. STRICTER than clearForUnlock — a
   * malfunction/constraint/rejected level is clear-for-unlock but NOT clear-for-passage.
   * .note = this is a per-reviewer-approval notion. it is NOT the judge's SUM-of-blockers
   *         threshold tally — for a threshold-tolerant guard (allowNitpicks > 0) the two can
   *         disagree, so the judge keeps its own SUM tally for the pass/fail decision and reads
   *         this only to detect an unrun level (see hasQueued).
   */
  clearForPassage: boolean;
  /**
   * a reviewer at this level is QUEUED (never ran). its blockers are unknown, so it produces no
   * review file — the exact gap that let an unlocked-but-unrun higher level slip past a
   * file-tally judge. an overruled level is never "queued" for gate purposes (the human waved it).
   */
  hasQueued: boolean;
}

/**
 * .what = per-level clearance for every review level, derived from the reviewers' verdicts and
 *         the human overrules — the one primitive all clearance consumers read
 * .why = collapses the ~6 independent "is level X terminal/overruled/clear" re-derivations onto
 *        one source, so a change to the clearance rule lands in exactly one place and the
 *        consumers can never silently disagree (the drift that caused the display contradiction).
 *
 * @returns one entry per distinct level, sorted low-to-high.
 */
export const getStoneGuardLevelClearance = (input: {
  reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }>;
  overruledLevels: Set<number>;
}): StoneGuardLevelClearance[] => {
  const isOverruled = (level: number): boolean =>
    isLevelOverruled({
      level,
      overruledLevels: input.overruledLevels,
    });

  // distinct levels, low-to-high — the ladder rungs in order
  const levels = [...new Set(input.reviewers.map((r) => r.level))].sort(
    (a, b) => a - b,
  );

  return levels.map((level) => {
    const atLevel = input.reviewers.filter((r) => r.level === level);
    const overruled = isOverruled(level);

    // clear-for-unlock: overruled, or every reviewer terminal-for-unlock
    const clearForUnlock =
      overruled || atLevel.every((r) => isReviewPeerVerdictTerminal(r.verdict));

    // clear-for-passage: overruled, or every reviewer approved (the strict, per-reviewer notion)
    const clearForPassage =
      overruled || atLevel.every((r) => r.verdict === 'approved');

    // a non-overruled level with an unrun (queued) reviewer — the file-tally hole indicator
    const hasQueued = !overruled && atLevel.some((r) => r.verdict === 'queued');

    return { level, overruled, clearForUnlock, clearForPassage, hasQueued };
  });
};
