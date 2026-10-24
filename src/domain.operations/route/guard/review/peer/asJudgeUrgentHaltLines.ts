import { MalfunctionError } from 'helpful-errors';

import { asRouteStoneSetCommandHead } from './asRouteStoneSetCommandHead';
import {
  formatReviewBudgetTopupCommand,
  ROUNDS_OFFERED_ON_TOPUP,
} from './formatReviewBudgetTopupCommand';
import {
  WARN_TEXT_CONCESSION_URGENT_HARM,
  WARN_TEXT_CONCESSION_URGENT_HEAD,
} from './genRouteGuardExhaustedReason';
import { JUDGE_HALT_ASK_HUMAN_LABEL } from './JUDGE_HALT_ASK_HUMAN_LABEL';

/**
 * .what = the lines the `reviewed?` judge prints when a live urgent concession holds the stone
 * .why = the halt names the remedy — a budget grant — so the reader can act on it. a pure render
 *        keeps the judge an orchestrator and lets each branch (one lane, several) be pinned
 *
 * 🔴 one command PER urgent lane, each scoped with `--peer`. a bare `--add` lands on the latest
 *    level alone, so where an urgent lane sits on a lower level an unscoped command would extend
 *    the wrong reviewer and leave the stone held
 *
 * 🔴 the owner line ("please ask your human to") is held by
 *    `define.invariant.review.peer.judge.urgent-guides-the-budget-ask`, which mirrors the
 *    `approved?` judge's ask. `rule.always.spend-own-levers-before-escalation` names the same
 *    top-up driver-owned under an urgent warrant. the two shipped briefs disagree; the invariant
 *    holds here until a council reconciles them
 *
 * .note = the round count is the shared `ROUNDS_OFFERED_ON_TOPUP` — the judge and the concede ack
 *         once drifted (`--add 1` here, `2` there), so both read the one const
 * .note = the head and harm clauses are `WARN_TEXT_CONCESSION_URGENT`'s own two parts — a driver
 *         who meets this halt, then route.drive's, reads one fact once
 */
export const asJudgeUrgentHaltLines = (input: {
  slugs: string[];
  stone: string;
}): string[] => {
  // a halt with no urgent lane would name no lane and offer no command. the one caller is this
  // repo's own judge, so an empty list is a broken internal invariant — a malfunction, exit 1
  if (input.slugs.length === 0)
    MalfunctionError.throw('urgent halt rendered with no urgent lane', {
      stone: input.stone,
    });

  const budgetCmds = input.slugs.map((slug) =>
    formatReviewBudgetTopupCommand({
      add: ROUNDS_OFFERED_ON_TOPUP,
      peer: slug,
      stone: input.stone,
    }),
  );
  const budgetRows = budgetCmds.map(
    (cmd, index) =>
      `   │  ${index === budgetCmds.length - 1 ? '└─' : '├─'} ${cmd}`,
  );

  return [
    '',
    `✋ halted, ${WARN_TEXT_CONCESSION_URGENT_HEAD} — ${input.slugs.join(', ')}`,
    `   ├─ ${WARN_TEXT_CONCESSION_URGENT_HARM}`,
    `   ├─ ${JUDGE_HALT_ASK_HUMAN_LABEL}`,
    ...budgetRows,
    '   │',
    '   └─ after the grant, address the concession, then run',
    `      └─ ${asRouteStoneSetCommandHead({ stone: input.stone })} --as passed`,
  ];
};
