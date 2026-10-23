import { UnexpectedCodePathError } from 'helpful-errors';

import {
  formatReviewBudgetTopupCommand,
  ROUNDS_OFFERED_ON_TOPUP,
} from './formatReviewBudgetTopupCommand';
import {
  WARN_TEXT_CONCESSION_URGENT_HARM,
  WARN_TEXT_CONCESSION_URGENT_HEAD,
} from './genRouteGuardExhaustedReason';

/**
 * .what = the lines the `reviewed?` judge prints when a live urgent concession holds the stone
 * .why = the halt names the remedy — a budget grant — so the reader can act on it. a pure render
 *        keeps the judge an orchestrator and lets each branch (one lane, several) be pinned
 *
 * 🔴 one command PER urgent lane, each scoped with `--peer`. a bare `--add` lands on the latest
 *    level alone, so where an urgent lane sits on a lower level an unscoped command would extend
 *    the wrong reviewer and leave the stone held
 *
 * 🔴 the top-up is named the DRIVER's lever: a live urgent concession is the warrant that makes it
 *    driver-owned (rule.always.spend-own-levers-before-escalation), and route.drive's budget halt
 *    labels the same lever `increase budget — yours to spend`. one lever, one owner, on every
 *    surface. the human is told why the stone bought budget — a sentence, never an ask
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
  // a halt with no urgent lane would name no lane and offer no command — a caller defect
  if (input.slugs.length === 0)
    UnexpectedCodePathError.throw('urgent halt rendered with no urgent lane', {
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
    '   ├─ increase budget — yours to spend',
    ...budgetRows,
    '   │',
    '   └─ then tell your human why this stone bought budget, address the concession, and run',
    `      └─ rhx route.stone.set --stone ${input.stone} --as passed`,
  ];
};
