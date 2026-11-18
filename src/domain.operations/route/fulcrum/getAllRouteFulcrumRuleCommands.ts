import type { RouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';

/**
 * .what = the rule commands a human runs, one per owed dispute
 * .why = the ask branch names each verdict command, so the human copies, never composes
 */
export const getAllRouteFulcrumRuleCommands = (input: {
  state: RouteFulcrumDisputeState;
}): string[] =>
  input.state.owedHuman.map(
    (entry) =>
      `rhx route.fulcrum.rule --case ${entry.frontmatter.case} --as upheld|conceded`,
  );
