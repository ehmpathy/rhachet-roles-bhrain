import { asMeterCountDisplay } from '../../asMeterCountDisplay';
import { ABSORPTION_CONCEDE_STEPS } from './absorptionConcedeSequence';
import type { ReviewConcernRef } from './asReviewConcernRef';
import { asReviewConcernRefLabel } from './asReviewConcernRef';
import {
  formatReviewBudgetTopupCommand,
  ROUNDS_OFFERED_ON_TOPUP,
} from './formatReviewBudgetTopupCommand';

// the two verbs both ack branches share with ABSORPTION_CONCEDE_STEPS — composed rather than
// re-spelled, so an S11 reword of either word lands once (r004 nitpick.3)
const [STEP_FIX, , STEP_REARRIVE] = ABSORPTION_CONCEDE_STEPS;

/**
 * .what = the lane's meter at the moment the stance was declared
 * .why = F05 — the concede's remedy is METER-driven. rounds left ⇒ re-arrive; budget spent ⇒ the
 *        SEVERITY decides. the branches are not three messages about one act; they are three
 *        different acts the driver must perform next.
 *
 * 🔴 .the meter alone decided this until the budget became a bound. it now decides whether a
 *    round can be SOUGHT; the grade decides whether one can be EARNED.
 */
export interface AbsorptionAckMeter {
  level: number;
  rounds: number;
  budget: number;
}

/**
 * .what = a reviewer and its meter — `mechanic (l1), 2 rounds, 4 budget — 2 rounds left`
 * .why = the tail is the branch condition made visible. a driver who sees `budget spent` beside a
 *        top-up command can check the emit's branch rather than take it on trust.
 *
 * 🔴 .this names the REVIEWER and its meter; the refusal's `asMeterSpendLine` names SPEND against
 *    the allowance (`mech-rules = 3/8 rounds spent — 5 left`). they are two concepts and they
 *    carry two names — this one names the reviewer and its level, that one names neither.
 *
 * ⚠️ .they are NOT one concept with two shapes around it — the outputs refute that, and they
 *    diverge on an unlimited budget (`∞ rounds left` here, `rounds spent, budget unlimited`
 *    there). ⇒ two names rather than one shared renderer, which would switch on which sentence to
 *    build.
 */
const asReviewerMeterLine = (input: {
  slug: string;
  meter: AbsorptionAckMeter;
}): string => {
  // an unlimited budget never spends down, so the tail reads '∞ rounds left' rather than a
  // subtraction of Infinity (which would print '-Infinity' / 'Infinity rounds left')
  const left = input.meter.budget - input.meter.rounds;
  const tail = !Number.isFinite(input.meter.budget)
    ? `∞ rounds left`
    : left > 0
      ? `${left} rounds left`
      : `budget spent`;
  const budget = asMeterCountDisplay(input.meter.budget);
  return `${input.slug} (l${input.meter.level}), ${input.meter.rounds} rounds, ${budget} budget — ${tail}`;
};

/**
 * .what = the acknowledgement a driver reads the instant a stance lands
 * .why = a stance is a declaration, so its ack owes the driver exactly one answer: what to do
 *        NEXT. the two absorptions diverge there completely — a dispute lifts its concern from the
 *        tally and the road may advance; a concede keeps the hold and commits the driver to a
 *        repair (S11).
 *
 * 🔴 the CONCEDE renders the `ABSORPTION_CONCEDE_SEQUENCE` order — the wisher ruled it: *"concede is
 *    to fix and run again … they want to ask for more budget AFTER hteir fixes"* (S11). a grant
 *    led with is a grant that sits unspent through the repair, and the meter then reads a round
 *    that may never be taken — which is exactly the coast S09's budget argument exists to prevent.
 *
 * 🔴 the top-up is ALWAYS `--peer <slug>`-scoped, never the bare `--add N`. S09: *"unless a
 *    level is explicitly rewound or budgetted, it should stay|become exhausted."* the bare form
 *    re-arms every lane on the stone, l1 included, so it is forbidden here rather than merely
 *    wide. this ack names its one lane by construction, so it cannot widen.
 *
 * ⚠️ it does NOT reach `computeBlockRemedyGroups`, and that is deliberate: that operation
 *    early-returns `[]` unless the reason holds `budget exhausted` or the passage is a terminal
 *    reviewer failure, and a stance is neither. its `--peer` slug also comes from a regex over
 *    that same reason. ⇒ both gates fail a stance ack, so the shape is rendered here and the
 *    scope is a conformance claim rather than a call.
 *
 * .note = no human is named on any branch. after a stance the driver has already declared its
 *         judgment, so `approve as-is — a human must grant` has no subject
 *         (rule.always.spend-own-levers-before-escalation).
 */
export const formatRouteGuardReviewPeerAbsorptionAck = (input: {
  absorption: 'disputed' | 'conceded';
  stone: string;
  slug: string;
  concern: ReviewConcernRef;
  /** the fulcrum a dispute cites. absent on a concede, which claims no judgment */
  why: string | null;
  /** the concede's graded harm — 'better' (default) or 'urgent' (S14). absent on a dispute */
  severity: 'better' | 'urgent' | null;
  meter: AbsorptionAckMeter;
  /** how many concerns this lane still owes a stance on, AFTER this one */
  concernsLeft: number;
  /**
   * how many concerns OTHER lanes still owe a stance on.
   * .why = r9 n2 — a lane that clears its last concern reads as an all-clear, and the driver
   *        can take `about = the last concern this lane owed` for "the stance phase is done".
   *        it is not done while another lane owes one. this makes the all-clear a TRUE
   *        all-clear: the tail names the road ahead when the lane is clear but the stone is not.
   */
  concernsElsewhere: number;
}): string => {
  const about = asReviewConcernRefLabel({ ref: input.concern });

  // the tail names what is still owed, so a driver knows whether the lane is settled
  const aboutTail =
    input.concernsLeft === 0
      ? ` — the last concern this lane owed`
      : ` — ${input.concernsLeft} more on this lane`;

  // the header echoes the INVOCATION, so the flags whose values pick a branch ride it together.
  // `--severity` is one: `urgent` and `better` take different tails below, exactly as `--as`
  // does. a dispute grades naught, so its severity is null and the term elides.
  const severityFlag = input.severity ? ` --severity ${input.severity}` : ``;

  const lines = [
    `🦉 so it is`,
    ``,
    `🗿 route.stone.set --as ${input.absorption}${severityFlag}`,
    `   ├─ stone = ${input.stone}`,
    `   ├─ with  = ${asReviewerMeterLine({ slug: input.slug, meter: input.meter })}`,
    `   ├─ about = ${about}${aboutTail}`,
  ];

  // this lane is settled but the stone is not — name the road ahead, so the all-clear on this
  // lane does not read as an all-clear on the stone (r9 n2)
  if (input.concernsLeft === 0 && input.concernsElsewhere > 0)
    lines.push(
      `   ├─ also  = ${input.concernsElsewhere} concern${input.concernsElsewhere === 1 ? '' : 's'} on other lanes await absorption`,
    );

  // a dispute cites the argument a council will read; a concede cites naught
  if (input.why) lines.push(`   ├─ why   = ${input.why}`);

  // an urgent concede ships nameable harm, so the driver owes its human an explanation (S14)
  //
  // 🔴 .the row names the CONSEQUENCE, never the grade — the header above carries the grade.
  //    to print `urgent` on both is one word twice on one screen, and the second copy dilutes
  //    the row a driver must act on (`rule.prefer.chill-nature-emojis`'s same argument, applied
  //    to a word). the header answers *what did i declare*; this answers *what it obliges*.
  //
  // 🔴 .the verb is imperative, and it is addressed to the driver.
  //    the warn is an obligation the driver discharges in prose it writes. no mechanism mails
  //    anyone, so a passive `your human is warned` names no actor (`rule.avoid.passive-voice`)
  //    and reads as a notification already sent. ⇒ a driver who trusts it writes naught, and the
  //    human learns of the spend from a diff rather than a sentence.
  //
  // 🟡 .the scope named is the STONE, never a pull or a tree.
  //    budget is granted per stone (`route.guard.budget --stone`), so the stone is what bought
  //    it and what a human asks about. a pull may hold many stones, or none of this one's
  //    rounds — so to name a pull points the explanation at the wrong unit.
  if (input.absorption === 'conceded' && input.severity === 'urgent')
    lines.push(
      `   ├─ warn  = ships harm — tell your human why this stone bought budget`,
    );

  lines.push(`   │`);

  // a dispute sheds its concern from the tally, so the next move is the road itself —
  // but ONLY once every other concern is absorbed too. a `drive on --as passed` printed
  // while a concern still stands contradicts the `about`/`also` lines two rows above, and
  // sends the driver into a halt the ack itself predicted (r10 b5)
  if (input.absorption === 'disputed') {
    const owedStill = input.concernsLeft + input.concernsElsewhere;
    lines.push(`   └─ the council will read it`);
    if (owedStill > 0) {
      lines.push(
        `      └─ absorb the ${owedStill} concern${owedStill === 1 ? '' : 's'} still owed, then drive on`,
      );
      return lines.join('\n');
    }
    lines.push(`      └─ drive on`);
    lines.push(
      `         └─ rhx route.stone.set --stone ${input.stone} --as passed`,
    );
    return lines.join('\n');
  }

  // a concede keeps the hold, and the remedy fits the meter (F05)
  //
  // 🔴 the same !Number.isFinite guard `asReviewerMeterLine`'s tail uses, never a raw compare — a
  //    NaN budget passes the tail's guard as "not finite → ∞ rounds left" while a raw
  //    `rounds >= budget` reads `NaN >= NaN` as false, so the two branches could disagree
  //    on whether the budget is spent (r007 blocker.4, i006)
  const spent = !Number.isFinite(input.meter.budget)
    ? false
    : input.meter.rounds >= input.meter.budget;

  // rounds remain, so the lane can confirm the fix without a grant — the budget term elides.
  // this tail is `ABSORPTION_CONCEDE_STEPS` with the budget step dropped (a grant is unowed);
  // the fix/re-arrive VERBS are composed from that array (r004 nitpick.3, r001.n2)
  if (!spent) {
    lines.push(`   └─ the hold stands. ${STEP_FIX}, then ${STEP_REARRIVE}`);
    lines.push(
      `      └─ rhx route.stone.set --stone ${input.stone} --as passed`,
    );
    return lines.join('\n');
  }

  // 🔴 the budget is spent, and the GRADE decides whether a round can still be bought.
  //
  // .why = the budget IS the allowance for `better` churn. inside the meter taste counts; past
  //        the meter only a nameable harm buys a round. so a `better` concession past a spent
  //        meter earns none, and an ack that hands over the command anyway does not offer the
  //        top-up — it SEQUENCES it, between the fix and the re-arrival, so a driver that obeys
  //        the instruction buys the round as step two of three.
  //
  // 🔴 .this branch was METER-driven alone, and the defect it produced was measured twice.
  //    once on this repo's own `1.vision` stone — an approved lane, 0 blockers, one `better`
  //    nitpick, and the buy rendered as the remedy. and once by a peer driver on a different
  //    route — seven `better` concessions, the same render three times in one halt. both drivers
  //    declined it by hand, which is the behavior this makes the engine perform.
  //
  // ⚠️ .the cost is real and it is stated rather than hidden: the lane that raised a `better`
  //    point never confirms its fix once the window closes. budget is cumulative rounds, and an
  //    artifact edit mints a new given rather than a restored round, so the loss is permanent.
  //
  // 🟡 .the test is `!== 'urgent'` rather than `=== 'better'`, and the difference is the NULL.
  //    `severity` is `'better' | 'urgent' | null`, so an ungraded stance takes THIS branch and
  //    is offered no round — the same direction `computeLiveUrgentConcessionSlugs` fails on the
  //    ledger, where an unsevered legacy row is dropped rather than kept. ⇒ the ack cannot
  //    advertise a round the gate would refuse, even on a stance that never graded.
  //
  // ⚠️ .the `absorption === 'conceded'` guard the urgent GRADE line carries is unneeded here,
  //    and only because the dispute branch above returns. do not reorder past it: a dispute has
  //    a null severity, so it would fall in and be told to fix a concern it argued against.
  if (input.severity !== 'urgent') {
    lines.push(
      `   └─ ${STEP_FIX} the ${input.concern.kind}, then ${STEP_REARRIVE}`,
    );
    lines.push(
      `      └─ rhx route.stone.set --stone ${input.stone} --as passed`,
    );
    return lines.join('\n');
  }

  // the lane spent its budget to raise this, so it has none left to CONFIRM the repair — and the
  // grade earned the round. the driver fixes, buys one round, then re-arrives — the full
  // `ABSORPTION_CONCEDE_STEPS` sequence, with the VERBS composed from that array (r009.n2/r001.n2)
  lines.push(
    `   └─ ${STEP_FIX} the ${input.concern.kind}, buy the round, then ${STEP_REARRIVE}`,
  );
  lines.push(
    `      ├─ ${formatReviewBudgetTopupCommand({
      add: ROUNDS_OFFERED_ON_TOPUP,
      peer: input.slug,
      stone: input.stone,
    })}`,
  );
  lines.push(`      └─ rhx route.stone.set --stone ${input.stone} --as passed`);
  return lines.join('\n');
};
