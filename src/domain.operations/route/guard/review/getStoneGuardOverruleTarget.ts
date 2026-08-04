import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { computeStoneGuardOverruleTarget } from './computeStoneGuardOverruleTarget';
import { getStoneGuardReviewPeerUncontemplatedUnforgiven } from './peer/getStoneGuardReviewPeerUncontemplatedUnforgiven';

/**
 * .what = the single resolution of "what level does an overrule/force target, and is
 *         there a target left to forgive at all?" — shared by setStoneAsOverruled and
 *         setStoneAsForced
 * .why = both admin escapes computed this identically (activeLevel → owed contemplation →
 *        levelToOverrule); a fix to one's edge case did NOT propagate to the other, and it
 *        drifted twice in this behavior's history. one source removes that drift class
 *        (rule.require.single-source-of-truth-for-render).
 *
 * an overrule forgives one of two passage-holds: a blocked rung (a non-null activeLevel —
 * a peer level, or the judge rung JUDGE_LEVEL on a judges-only stone), or an owed
 * contemplation gate (an un-overruled reviewer whose blockers await a .taken — design-note
 * B6). when NEITHER stands, there is no target (hasTarget = false), and the caller must NOT
 * mint a false "forgiven by human" record on a merit-clear rung.
 */
export const getStoneGuardOverruleTarget = async (input: {
  stone: RouteStone;
  route: string;
  levelState: { hasLevels: boolean; activeLevel: number | null };
}): Promise<{
  hasTarget: boolean;
  levelToOverrule: number | undefined;
}> => {
  // when no rung blocks (activeLevel null), the sole target left is an owed,
  // un-forgiven contemplation — load it to tell a spurious overrule from a real escape
  const owed =
    input.levelState.activeLevel === null
      ? await getStoneGuardReviewPeerUncontemplatedUnforgiven({
          stone: input.stone,
          route: input.route,
        })
      : [];

  // hand the loaded state to the pure decision core — the branch matrix lives there, unit-tested
  return computeStoneGuardOverruleTarget({
    activeLevel: input.levelState.activeLevel,
    owedLevels: owed.map((reviewer) => reviewer.level),
  });
};
