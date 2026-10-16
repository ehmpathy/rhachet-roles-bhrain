/**
 * .what = joins every concurrent halt reason, in precedence order, exhaustion last
 * .why = the render and the replay both key off this one combined reason string, so
 *        its order (malfunction, then constraint, then exhaustion) has one home
 */
export const asGuardHaltCombinedReason = (input: {
  hasMalfunction: boolean;
  hasConstraint: boolean;
  exhaustedReason: string;
}): string =>
  [
    ...(input.hasMalfunction ? ['reviewer or judge malfunctioned'] : []),
    ...(input.hasConstraint ? ['reviewer constraint'] : []),
    input.exhaustedReason,
  ].join('; ');
