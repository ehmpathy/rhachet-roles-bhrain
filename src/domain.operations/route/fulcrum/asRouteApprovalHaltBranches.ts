import { asRouteStoneSetCommandHead } from '../guard/review/peer/asRouteStoneSetCommandHead';
import { JUDGE_HALT_ASK_HUMAN_LABEL } from '../guard/review/peer/JUDGE_HALT_ASK_HUMAN_LABEL';
import { asRouteFulcrumApprovalDisputeLines } from './asRouteFulcrumApprovalDisputeLines';
import { asRouteFulcrumCommandRows } from './asRouteFulcrumCommandRows';
import type { RouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';
import { getAllRouteFulcrumVerdictCommands } from './getAllRouteFulcrumVerdictCommands';

/**
 * .what = the branches beneath an approval halt's head: each deferral, then the ask a human
 *         runs and the pass that follows — or, while the driver owes a repair, the repair alone
 * .why = the drive halt and the `approved?` judge are two faces of one gate; one render, so the
 *        two never print different asks. and a halt that names a repair must not also ask the
 *        human to approve what the gate will refuse until it lands
 *
 * .note = each line opens with a branch glyph; the caller prefixes its own indent beneath its head
 */
export const asRouteApprovalHaltBranches = (input: {
  stone: string;
  disputes:
    | { state: RouteFulcrumDisputeState; refusal: null }
    | { state: null; refusal: string };
}): string[] => {
  const disputeLines = asRouteFulcrumApprovalDisputeLines({
    disputes: input.disputes,
  });

  // a repair the driver owes comes first; approval is refused until it lands
  const state = input.disputes.state;
  if (!state || state.unreadable.length > 0)
    return [
      ...disputeLines,
      `└─ once each fault is repaired, run`,
      `   └─ rhx route.drive`,
    ];

  // the ask: a verdict on each dispute, then the approval, then the pass
  const head = asRouteStoneSetCommandHead({ stone: input.stone });
  const verdictCmds = getAllRouteFulcrumVerdictCommands({ state });
  return [
    ...disputeLines,
    verdictCmds.length
      ? `├─ ${JUDGE_HALT_ASK_HUMAN_LABEL} rule on each, then approve`
      : `├─ ${JUDGE_HALT_ASK_HUMAN_LABEL}`,
    ...asRouteFulcrumCommandRows({
      commands: [...verdictCmds, `${head} --as approved`],
    }).map((row) => `│  ${row}`),
    `│`,
    `└─ once they do, run`,
    `   └─ ${head} --as passed`,
  ];
};
