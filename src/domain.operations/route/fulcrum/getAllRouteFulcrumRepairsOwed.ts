import type {
  RouteFulcrumDisputeEntry,
  RouteFulcrumDisputeState,
} from './asRouteFulcrumDisputeState';

/**
 * .what = the ruled entries a human conceded that no approval has followed yet
 * .why = a concession names a repair the driver owes. the dispute lines print it as owed, and the
 *        approval halt orders its ask around it — the repair lands, then the human approves — so
 *        both read one definition and never disagree on which entries still owe a repair
 */
export const getAllRouteFulcrumRepairsOwed = (input: {
  state: RouteFulcrumDisputeState;
}): RouteFulcrumDisputeEntry[] =>
  input.state.ruled.filter(
    (entry) =>
      entry.frontmatter.verdict?.ruled === 'conceded' && !entry.approvedOn,
  );
