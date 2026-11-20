import type { RouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';
import { asRouteFulcrumVerdictCommand } from './asRouteFulcrumVerdictCommand';

/**
 * .what = the rule commands a human runs, one per owed dispute
 * .why = the ask branch names each verdict command, so the human copies, never composes
 */
export const getAllRouteFulcrumVerdictCommands = (input: {
  state: RouteFulcrumDisputeState;
}): string[] =>
  input.state.owedHuman.map((entry) => asRouteFulcrumVerdictCommand({ entry }));
