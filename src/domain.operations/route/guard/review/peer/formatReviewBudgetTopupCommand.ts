/**
 * .what = how many rounds a top-up offers by default
 * .why = the concede ack and the `reviewed?` judge's urgent-concession halt each grant budget,
 *        and they had drifted — the ack offered `2`, the judge hard-coded `--add 1`. one shared
 *        const, so the amount a driver reads for the same lever is stable across surfaces
 *        (rule.require.runtime-guard-vars-in-shared-const, rule.forbid.friction-hazards). 2 is
 *        the smallest useful grant: one round to re-read the fix, one in reserve where the
 *        re-read raises a follow-on. a `1` strands the driver at the same wall.
 */
export const ROUNDS_OFFERED_ON_TOPUP = 2;

/**
 * .what = the ONE canonical `route.guard.budget --for review` top-up command string
 * .why = the exact command travelled in two copies — the exhaustion remedy
 *        (`computeBlockRemedyGroups`) and the concede ack (`formatRouteGuardReviewPeerAbsorptionAck`).
 *        two copies of a command are two places a flag rename must land, and
 *        `rule.forbid.duplicate-format-tree-operations` names that exact hazard: one shared
 *        builder parameterized by the context differences, so a change lands once.
 *
 * .note = the two callers differ on exactly the two parameters below — the amount (a literal `N`
 *         a human fills, versus a concrete round count) and whether one lane is named. each other
 *         part — the verb, the `--for review` scope, the `--stone` tail — is one truth here.
 */
export const formatReviewBudgetTopupCommand = (input: {
  /** the round count to add — a concrete number, or the literal `'N'` a human fills in */
  add: number | 'N';
  /** the one lane to scope the top-up to, or null to extend every exhausted lane */
  peer: string | null;
  stone: string;
}): string => {
  const peerArg = input.peer ? ` --peer ${input.peer}` : '';
  return `rhx route.guard.budget --for review --add ${input.add}${peerArg} --stone ${input.stone}`;
};
