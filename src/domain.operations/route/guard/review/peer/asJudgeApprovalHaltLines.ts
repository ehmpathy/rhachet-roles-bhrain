import { asRouteStoneSetCommandHead } from './asRouteStoneSetCommandHead';
import { JUDGE_HALT_ASK_HUMAN_LABEL } from './JUDGE_HALT_ASK_HUMAN_LABEL';

/**
 * .what = the lines the `approved?` judge prints when a stone awaits human approval
 * .why = approval is a human's alone (`setStoneAsApproved` refuses a caller with no TTY), so this
 *        halt names a human as the owner. a pure render lets that owner line be pinned by a unit
 *        test, beside its peer `asJudgeUrgentHaltLines`, whose owner is the driver
 *        (`define.invariant.review.peer.judge.urgent-guides-the-budget-grant`)
 */
export const asJudgeApprovalHaltLines = (input: {
  stone: string;
}): string[] => [
  '✋ halted, human approval required',
  `   ├─ ${JUDGE_HALT_ASK_HUMAN_LABEL}`,
  `   │  └─ ${asRouteStoneSetCommandHead({ stone: input.stone })} --as approved`,
  '   │',
  '   └─ after human approves, run',
  `      └─ ${asRouteStoneSetCommandHead({ stone: input.stone })} --as passed`,
];
