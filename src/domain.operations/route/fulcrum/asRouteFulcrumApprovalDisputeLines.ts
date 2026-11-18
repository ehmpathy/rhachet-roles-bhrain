import { asRouteFulcrumDisputeLines } from './asRouteFulcrumDisputeLines';
import type { RouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';

/**
 * .what = the dispute block of an approval halt: each deferral, or the refusal that names why the
 *         record cannot be read, then the repair step when the driver owes one
 * .why = the drive halt and the `approved?` judge are two faces of one gate; one block, so a
 *        corrupt ledger or an unreadable fulcrum reads the same on both, and neither tells the
 *        human to approve what the gate will refuse
 */
export const asRouteFulcrumApprovalDisputeLines = (input: {
  disputes:
    | { state: RouteFulcrumDisputeState; refusal: null }
    | { state: null; refusal: string };
}): string[] => {
  const disputeLines = input.disputes.state
    ? asRouteFulcrumDisputeLines({ state: input.disputes.state })
    : asFulcrumRecordUnreadableLines({ refusal: input.disputes.refusal });

  // an unreadable fulcrum or record is the driver's to repair; approval refuses until it is
  const isRepairOwed =
    !input.disputes.state || input.disputes.state.unreadable.length > 0;
  const repairLines = isRepairOwed
    ? [
        `├─ first, the driver repairs each fault above; approval is refused until then`,
        `│`,
      ]
    : [];
  return [...disputeLines, ...repairLines];
};

/**
 * .what = the dispute branch of the approval halt when the dispute record cannot be read
 * .why = the approval will refuse on the same fault, so the human must see it, and its fix,
 *        before they try to approve
 */
const asFulcrumRecordUnreadableLines = (input: {
  refusal: string;
}): string[] => {
  // the refusal's headline is a leaf; its own tree (indented under it) hangs beneath
  const [headline, ...body] = input.refusal.split('\n');
  return [
    `├─ the dispute record cannot be read; approval is refused until it is repaired`,
    `│  └─ ${headline}`,
    ...body.map((line) => `│  ${line}`),
    `│`,
  ];
};
