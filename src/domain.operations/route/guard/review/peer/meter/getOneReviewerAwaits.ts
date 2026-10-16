/**
 * .what = the lower level a reviewer awaits — the first one not yet clear-for-unlock — or
 *         false where no lower level holds it
 * .why = the `awaits` line a guard tree renders must agree with the runner's own gate. one
 *        named claim states the rule, so the meter's status build reads as a chain of acts
 *        (rule.forbid.decode-friction-in-orchestrators)
 *
 * .note = a level that has already poured never awaits, whatever the ladder now says
 *         (define.invariant.review.peer.level-unlock-is-a-latch). the runner reads the latch
 *         to decide whether to pour; this render reads the same fact, or the two disagree
 *         inside one stdout (rule.require.single-source-of-truth-for-render)
 * .note = a level with no reviewers is absent from `clearanceByLevel`, and reads as clear —
 *         there is none to await
 */
export const getOneReviewerAwaits = (input: {
  level: number;
  levelsPoured: ReadonlySet<number>;
  clearanceByLevel: ReadonlyMap<number, { clearForUnlock: boolean }>;
}): { level: number } | false => {
  // a poured level, and level 1, never await
  if (input.levelsPoured.has(input.level) || input.level <= 1) return false;

  // the first lower level that is not clear holds this reviewer
  const levelsBelow = Array.from({ length: input.level - 1 }, (_, i) => i + 1);
  const levelHeld = levelsBelow.find(
    (level) => !(input.clearanceByLevel.get(level)?.clearForUnlock ?? true),
  );
  return levelHeld !== undefined ? { level: levelHeld } : false;
};
