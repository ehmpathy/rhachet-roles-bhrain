import { MalfunctionError } from 'helpful-errors';

import { asRouteStoneSetCommandHead } from './asRouteStoneSetCommandHead';
import {
  formatReviewBudgetGrantCommand,
  ROUNDS_OFFERED_ON_GRANT,
} from './formatReviewBudgetGrantCommand';
import {
  ASK_TEXT_BUDGET_NOTE,
  REMEDY_LABEL_BUDGET_GRANT,
  WARN_TEXT_CONCESSION_URGENT_HARM,
  WARN_TEXT_CONCESSION_URGENT_HEAD,
} from './genRouteGuardExhaustedReason';
import {
  type BudgetGrantMeter,
  hasReviewerRunDry,
} from './meter/computeBudgetGrantRefusal';

/**
 * .what = the lines the `reviewed?` judge prints when a live urgent concession holds the stone
 * .why = the halt names the remedy — the driver's own grant — so the reader can act on it. a pure
 *        render keeps the judge an orchestrator and lets each branch (one lane, several, dry or
 *        not) be pinned
 *
 * 🔴 the owner is the DRIVER: the label is the drive halt's own (`REMEDY_LABEL_BUDGET_GRANT`, whose
 *    docblock holds why), so the two surfaces cannot name two owners for one lever
 *    (`define.invariant.review.peer.judge.urgent-guides-the-budget-grant`)
 *
 * 🔴 the grant is offered ONLY for a lane run dry, read by the gate's own `hasReviewerRunDry`. a
 *    lane with a round in hand (a concede, then a re-arrive with no artifact change, so the lane
 *    stays cached) would refuse a grant `rounds-remain`, so the halt names the fix instead: the
 *    printed lever always lands
 *
 * 🔴 the human still hears of the spend, from the driver: the note ask sits beside the grant, at
 *    the moment the driver decides to spend (`define.invariant.review.peer.budget.urgent-earns-budget`)
 *
 * 🔴 one command PER dry urgent lane, each scoped with `--peer`. a bare `--add` lands on the latest
 *    level alone, so where an urgent lane sits on a lower level an unscoped command would extend
 *    the wrong reviewer and leave the stone held
 *
 * .note = the round count is the shared `ROUNDS_OFFERED_ON_GRANT` — the judge and the concede ack
 *         once drifted (`--add 1` here, `2` there), so both read the one const
 * .note = the head and harm clauses are `WARN_TEXT_CONCESSION_URGENT`'s own two parts — a driver
 *         who meets this halt, then route.drive's, reads one fact once
 */
export const asJudgeUrgentHaltLines = (input: {
  /**
   * qualified by the lane set it names: `urgent` = the lanes that carry a live urgent concession
   */
  slugs: { urgent: string[] };
  /**
   * the stone's live peer meters; a lane with no meter here is unread — offered no grant, and
   * never called in hand
   */
  meters: BudgetGrantMeter[];
  stone: string;
}): string[] => {
  // a halt with no urgent lane would name no lane and offer no command. the one caller is this
  // repo's own judge, so an empty list is a broken internal invariant — a malfunction, exit 1
  if (input.slugs.urgent.length === 0)
    MalfunctionError.throw('urgent halt rendered with no urgent lane', {
      stone: input.stone,
    });

  // split the urgent lanes by the gate's own moment check: dry → a grant lands; a meter not dry →
  // a round is in hand; no meter → its spend is unknown, so the halt claims neither
  const isMetered = (slug: string): boolean =>
    input.meters.some((meter) => meter.slug === slug);
  const slugsDry = input.slugs.urgent.filter((slug) =>
    input.meters.some(
      (meter) => meter.slug === slug && hasReviewerRunDry({ meter }),
    ),
  );
  const slugsInHand = input.slugs.urgent.filter(
    (slug) => isMetered(slug) && !slugsDry.includes(slug),
  );
  const slugsUnread = input.slugs.urgent.filter((slug) => !isMetered(slug));

  // the grant block: one scoped command per dry lane, then the note ask
  const budgetCmds = slugsDry.map((slug) =>
    formatReviewBudgetGrantCommand({
      add: ROUNDS_OFFERED_ON_GRANT,
      peer: slug,
      stone: input.stone,
    }),
  );
  const grantRows =
    budgetCmds.length === 0
      ? []
      : [
          `   ├─ ${REMEDY_LABEL_BUDGET_GRANT}`,
          ...budgetCmds.map(
            (cmd, index) =>
              `   │  ${index === budgetCmds.length - 1 ? '└─' : '├─'} ${cmd}`,
          ),
          `   ├─ 🟡 ${ASK_TEXT_BUDGET_NOTE}`,
        ];

  // the in-hand row: a lane that still has a round needs no grant yet
  const inHandRows =
    slugsInHand.length === 0
      ? []
      : [
          `   ├─ a round is in hand — ${slugsInHand.join(', ')}; a grant opens once it runs dry`,
        ];

  // the unread row: a lane with no meter has an unknown spend — never claimed dry, nor in hand
  const unreadRows =
    slugsUnread.length === 0
      ? []
      : [
          `   ├─ spend unread — ${slugsUnread.join(', ')}; no grant is offered until its meter reads dry`,
        ];

  return [
    '',
    `✋ halted, ${WARN_TEXT_CONCESSION_URGENT_HEAD} — ${input.slugs.urgent.join(', ')}`,
    `   ├─ ${WARN_TEXT_CONCESSION_URGENT_HARM}`,
    ...grantRows,
    ...inHandRows,
    ...unreadRows,
    '   │',
    slugsDry.length > 0
      ? '   └─ after the grant, address the concession, then run'
      : '   └─ address the concession, then run',
    `      └─ ${asRouteStoneSetCommandHead({ stone: input.stone })} --as passed`,
  ];
};
