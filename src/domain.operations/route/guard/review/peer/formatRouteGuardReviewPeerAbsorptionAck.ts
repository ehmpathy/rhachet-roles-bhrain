import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asMeterCountDisplay } from '../../asMeterCountDisplay';
import { ABSORPTION_CONCEDE_STEPS } from './absorptionConcedeSequence';
import type { ReviewConcernRef } from './asReviewConcernRef';
import { asReviewConcernRefLabel } from './asReviewConcernRef';
import { asRouteStoneAbsorbCommand } from './asRouteStoneAbsorbCommand';
import { asRouteStoneSetCommandHead } from './asRouteStoneSetCommandHead';
import { asRouteStoneStanceCommand } from './asRouteStoneStanceCommand';
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
      ? `${asCountedNoun({ count: left, one: 'round', many: 'rounds' })} left`
      : `budget spent`;
  const budget = asMeterCountDisplay(input.meter.budget);
  const rounds = asCountedNoun({
    count: input.meter.rounds,
    one: 'round',
    many: 'rounds',
  });
  return `${input.slug} (l${input.meter.level}), ${rounds}, ${budget} budget — ${tail}`;
};

/**
 * .what = the two stance commands for one concern — concede (the default) first, then dispute
 * .why = each taught command carries its REQUIRED flag (--severity on a concede, --why on a
 *        dispute), so a driver who copies one is never refused at the boundary (r9 b1)
 */
const asStanceCommands = (input: {
  stone: string;
  slug: string;
  about: string;
}): [string, string] => [
  asRouteStoneStanceCommand({
    stone: input.stone,
    as: 'conceded',
    with: input.slug,
    about: input.about,
  }).command,
  asRouteStoneStanceCommand({
    stone: input.stone,
    as: 'disputed',
    with: input.slug,
    about: input.about,
    why: '<fulcrum-path>',
  }).command,
];

/**
 * .what = one numbered step of the road ahead: a title, and the commands it owes
 */
interface AbsorptionAckStep {
  title: string;
  commands: string[];
}

/**
 * .what = the ordered steps that remain after this stance, for the state the stone is in
 * .why = a stance ack owes the driver the TRUE next command, and the truth depends on state:
 *          (a) this lane still owes a stance  → the next concern on this lane
 *          (b) this lane is clear             → absorb this lane's feedback, then whatever
 *                                               other lanes still owe
 *          (c) every stance is in             → re-arrive, which re-runs the guard
 *        a stance never ends the conversation on its own: the `.taken` is gated on every
 *        concern's stance (define.invariant.review.peer.absorb), so `--as absorbed` is owed
 *        AFTER the last stance on a lane, and before the re-arrival.
 *
 * 🔴 re-arrival is `--as arrived` — the verb the step names. `arrived` is the alias that runs the
 *    guard (stepRouteStoneSet maps it onto the passage path), so the word printed and the act
 *    performed agree. an ack that said "re-arrive" above a `--as passed` read as two acts.
 */
const asAbsorptionAckSteps = (input: {
  absorption: 'disputed' | 'conceded';
  stone: string;
  slug: string;
  concern: ReviewConcernRef;
  /** the lane spent its budget AND the concede is urgent — only then is a round earned */
  buysRound: boolean;
  concernsLeft: number;
  concernNextOnLane: string | null;
  concernsElsewhere: number;
  concernNextElsewhere: { slug: string; about: string } | null;
}): AbsorptionAckStep[] => {
  // (a) this lane still owes a stance — the next one on it is the only next act
  if (input.concernsLeft > 0) {
    const about = input.concernNextOnLane ?? '<concern>';
    return [
      {
        title: `absorb ${about} — ${input.concernsLeft} still owed on this lane`,
        commands: asStanceCommands({
          stone: input.stone,
          slug: input.slug,
          about,
        }),
      },
    ];
  }

  // (b) this lane is clear — its feedback is now absorbable, and is owed before the re-arrival
  // .note = the title is an instruction (absorb the lane, as a whole) and its reason (each
  //         concern already carries a stance), so it never reads as a claim the lane is done
  const stepAbsorbLane: AbsorptionAckStep = {
    title: `now absorb ${input.slug} as a whole — each of its concerns carries a stance`,
    commands: [
      asRouteStoneAbsorbCommand({ stone: input.stone, that: input.slug })
        .command,
    ],
  };

  // other lanes still owe stances — name the next one, so the driver need not hunt for it
  const nextElsewhere = input.concernNextElsewhere;
  const stepsElsewhere: AbsorptionAckStep[] =
    input.concernsElsewhere > 0
      ? [
          {
            title: `absorb the ${input.concernsElsewhere} concern${
              input.concernsElsewhere === 1 ? '' : 's'
            } on other lanes${
              nextElsewhere
                ? ` — next, ${nextElsewhere.slug} ${nextElsewhere.about}`
                : ''
            }`,
            commands: asStanceCommands({
              stone: input.stone,
              slug: nextElsewhere?.slug ?? '<slug>',
              about: nextElsewhere?.about ?? '<concern>',
            }),
          },
        ]
      : [];

  // an URGENT concede on a spent lane buys the round that confirms the fix — after the fix (S11),
  // and always scoped to this one lane (S09). a `better` grade past the meter earns no round
  const stepsTopup: AbsorptionAckStep[] =
    input.absorption === 'conceded' && input.buysRound
      ? [
          {
            title: `buy the round, once the ${input.concern.kind} is fixed`,
            commands: [
              formatReviewBudgetTopupCommand({
                add: ROUNDS_OFFERED_ON_TOPUP,
                peer: input.slug,
                stone: input.stone,
              }),
            ],
          },
        ]
      : [];

  // (c) the re-arrival re-runs the guard; a concede re-arrives only once its fix is in
  const stepRearrive: AbsorptionAckStep = {
    title:
      input.absorption === 'conceded'
        ? `${STEP_REARRIVE}, once the fix is in`
        : STEP_REARRIVE,
    commands: [
      `${asRouteStoneSetCommandHead({ stone: input.stone })} --as arrived`,
    ],
  };

  return [stepAbsorbLane, ...stepsElsewhere, ...stepsTopup, stepRearrive];
};

/**
 * .what = the steps, rendered as a tree under the ack's close — numbered only when >1
 */
const asAbsorptionAckStepLines = (input: {
  steps: AbsorptionAckStep[];
}): string[] => {
  const isNumbered = input.steps.length > 1;
  return input.steps.flatMap((step, index) => {
    const isLastStep = index === input.steps.length - 1;
    const branchStep = isLastStep ? '└─' : '├─';
    const trunkStep = isLastStep ? '   ' : '│  ';
    const prefix = isNumbered ? `${index + 1}. ` : '';
    return [
      `      ${branchStep} ${prefix}${step.title}`,
      ...step.commands.map((command, at) => {
        const branchCommand = at === step.commands.length - 1 ? '└─' : '├─';
        return `      ${trunkStep}${branchCommand} ${command}`;
      }),
    ];
  });
};

/**
 * .what = the acknowledgement a driver reads the instant a stance lands
 * .why = a stance is a declaration, so its ack owes the driver exactly one answer: what to do
 *        NEXT. the two absorptions diverge in what they claim — a dispute lifts its concern from
 *        the tally; a concede keeps the hold and commits the driver to a repair (S11) — but they
 *        share the road ahead: the rest of the lane's stances, the lane's `--as absorbed`, the
 *        other lanes' stances, then the re-arrival (asAbsorptionAckSteps).
 *
 * 🔴 the CONCEDE renders the `ABSORPTION_CONCEDE_SEQUENCE` order — fix, then budget, then
 *    re-arrive (S11). a grant led with is a grant that sits unspent through the repair.
 *
 * 🔴 the top-up is ALWAYS `--peer <slug>`-scoped, never the bare `--add N` (S09). the bare
 *    form re-arms every lane on the stone, l1 included.
 *
 * ⚠️ it does NOT reach `computeBlockRemedyGroups`, and that is deliberate: that operation
 *    early-returns `[]` unless the reason holds `budget exhausted` or the passage is a terminal
 *    reviewer failure, and a stance is neither.
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
  /** the concede's graded harm — 'better' or 'urgent' (S14). absent on a dispute */
  severity: 'better' | 'urgent' | null;
  meter: AbsorptionAckMeter;
  /** how many concerns this lane still owes a stance on, AFTER this one */
  concernsLeft: number;
  /** the label of the next concern this lane owes, or null when the lane is clear */
  concernNextOnLane: string | null;
  /**
   * how many concerns OTHER lanes still owe a stance on.
   * .why = r9 n2 — a lane that clears its last concern reads as an all-clear, and the driver
   *        can take `about = the last concern this lane owed` for "the stance phase is done".
   *        it is not done while another lane owes one.
   */
  concernsElsewhere: number;
  /** the next concern another lane owes, or null when none is owed elsewhere */
  concernNextElsewhere: { slug: string; about: string } | null;
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

  // .note = deliberate local line-builder, scoped to this formatter: the array is born in
  //         this call, grows by the conditional pushes below in render order, and only
  //         its joined string escapes
  //         (rule.require.immutable-vars — the scoped emit-builder exception)
  const lines = [
    `🦉 so it is`,
    ``,
    `🗿 route.stone.set --as ${input.absorption}${severityFlag}`,
    `   ├─ stone = ${input.stone}`,
    `   ├─ with  = ${asReviewerMeterLine({ slug: input.slug, meter: input.meter })}`,
    `   ├─ about = ${about}${aboutTail}`,
  ];

  // this lane is settled but the stone is not — name the road ahead, so the all-clear on this
  // lane does not read as an all-clear on the stone (r9 n2). the noun AND the verb agree with
  // the count — `1 concern … awaits`, `3 concerns … await` (r014 nitpick.1, i014)
  if (input.concernsLeft === 0 && input.concernsElsewhere > 0)
    lines.push(
      `   ├─ also  = ${asCountedNoun({ count: input.concernsElsewhere, one: 'concern on other lanes awaits', many: 'concerns on other lanes await' })} absorption`,
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

  // 🔴 the same !Number.isFinite guard `asReviewerMeterLine`'s tail uses, never a raw compare — a
  //    NaN budget passes the tail's guard as "not finite → ∞ rounds left" while a raw
  //    `rounds >= budget` reads `NaN >= NaN` as false, so the two could disagree (r007 b4)
  const spent = !Number.isFinite(input.meter.budget)
    ? false
    : input.meter.rounds >= input.meter.budget;

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
  // 🟡 .the test is `=== 'urgent'` rather than `!== 'better'`, and the difference is the NULL.
  //    `severity` is `'better' | 'urgent' | null`, so an ungraded stance buys no round and
  //    is offered none — the same direction `computeLiveUrgentConcessionSlugs` fails on the
  //    ledger, where an unsevered legacy row is dropped rather than kept. ⇒ the ack cannot
  //    advertise a round the gate would refuse, even on a stance that never graded.
  //
  // ⚠️ .the `absorption === 'conceded'` guard the urgent GRADE line carries is needed here too:
  //    a dispute has a null severity, so it must never be told to buy a round for a concern it
  //    argued against.
  const buysRound =
    input.absorption === 'conceded' && spent && input.severity === 'urgent';

  // the close names what the stance did to the hold; the steps name what is owed next
  const close =
    input.absorption === 'disputed'
      ? `the council will read it`
      : buysRound
        ? `the hold stands. ${STEP_FIX} the ${input.concern.kind}, buy the round, then ${STEP_REARRIVE}`
        : spent
          ? `the hold stands. ${STEP_FIX} the ${input.concern.kind}, then ${STEP_REARRIVE}`
          : `the hold stands. ${STEP_FIX}, then ${STEP_REARRIVE}`;
  lines.push(`   └─ ${close}`);

  const steps = asAbsorptionAckSteps({
    absorption: input.absorption,
    stone: input.stone,
    slug: input.slug,
    concern: input.concern,
    buysRound,
    concernsLeft: input.concernsLeft,
    concernNextOnLane: input.concernNextOnLane,
    concernsElsewhere: input.concernsElsewhere,
    concernNextElsewhere: input.concernNextElsewhere,
  });
  lines.push(...asAbsorptionAckStepLines({ steps }));
  return lines.join('\n');
};
