/**
 * .what = the pure decision at the heart of getStoneGuardOverruleTarget: given a stone's active
 *         level and the levels that owe an un-forgiven contemplation, decide whether an
 *         overrule/force has a target at all, and which level it forgives.
 * .why = the branch matrix (activeLevel null/non-null × owed empty/multi × Math.min selection) is
 *        the part that drifted twice in this behavior's history. kept pure so its whole matrix is
 *        unit-checkable without a route on disk — the fs read lives in getStoneGuardOverruleTarget,
 *        the decision lives here (rule.require.orchestrators-as-narrative).
 *
 * .note = the judge is the top rung (JUDGE_LEVEL), reported as the activeLevel by
 *         getStoneGuardLevelState for a judges-only stone, and for a peer+judge stone once its
 *         peers clear and the judge itself holds. so a judge overrule needs no special branch
 *         here — it is just an activeLevel like any other rung.
 */
export const computeStoneGuardOverruleTarget = (input: {
  activeLevel: number | null;
  owedLevels: number[];
}): {
  hasTarget: boolean;
  levelToOverrule: number | undefined;
} => {
  // a target exists when: a blocked active level, OR an owed contemplation
  const hasTarget = input.activeLevel !== null || input.owedLevels.length > 0;

  // scope: the blocked active level, or the LOWEST level that owes a .taken
  const levelToOverrule =
    input.activeLevel ??
    (input.owedLevels.length > 0 ? Math.min(...input.owedLevels) : undefined);

  return { hasTarget, levelToOverrule };
};
