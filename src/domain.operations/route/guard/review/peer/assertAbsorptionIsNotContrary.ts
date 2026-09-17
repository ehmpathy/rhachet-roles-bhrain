import { BadRequestError } from 'helpful-errors';

import {
  getAbsorptionOnConcern,
  type ReviewAbsorption,
} from './getStoneReviewAbsorptions';

/**
 * .what = R3 — refuses a CONTRARY second stance on the same concern of the same given
 * .why = a stance is final for its given. a record that flips records naught at all: the
 *        council reads a ledger to tell churn from agreement, and a concern that reads
 *        `disputed` then `conceded` on one unchanged given tells them neither.
 *
 * 🔴 it keys on `(reviewer, concern, given)` — never on the lane (S07). a lane-keyed R3
 *    would refuse the commonest honest act there is: **agree with one point and argue
 *    another.** case=3's driver does exactly that across three blockers, and case=8 [t2b]
 *    walks it.
 *
 * ✅ an IDENTICAL second stance is admitted, idempotently — `rule.require.idempotent-operations`.
 *    a design that refused both would break it; one that admitted both would make the wish's
 *    *"neither, or both, is refused"* unenforceable.
 *
 * .note = the exit is real and it is the driver's OWN: edit the artifact, re-arrive, and the
 *         lane mints a NEW given — against which the stance slot re-opens by construction
 *         (S03). the human rewind is named second, for a driver who wants it void NOW.
 */
export const assertAbsorptionIsNotContrary = (input: {
  absorptions: ReviewAbsorption[];
  reviewer: string;
  about: string;
  given: string;
  intent: 'disputed' | 'conceded';
  stone: string;

  /**
   * the severity a CONCEDE carries, and the fulcrum a DISPUTE names
   *
   * .why = they are part of what a stance SAYS, so a re-declaration that changes one is a
   *        re-grade rather than a repeat. absent them, the key was (status, reviewer, about,
   *        given) and a `better` → `urgent` upgrade read as idempotent: R3 admitted it, the
   *        write was skipped as already-on-record, and the ack rendered the NEW grade while
   *        the ledger kept the old one. the judge then shed the row as `better`, so the stone
   *        passed with no human and no warn — the driver told their urgent grade was on
   *        record when it was not (r7 b1, a silent-divergence behavior hazard).
   */
  severity?: 'better' | 'urgent';
  why?: string;
}): void => {
  const extant = getAbsorptionOnConcern({
    absorptions: input.absorptions,
    reviewer: input.reviewer,
    about: input.about,
    given: input.given,
  });

  // no stance stands on this concern — the slot is open
  if (!extant) return;

  // the same stance again is idempotent, so it is admitted and writes no second row.
  // 🔴 "the same" spans what the stance SAYS, never merely its status — a changed grade or
  //    a changed fulcrum falls through to the refusal below
  if (extant.status === input.intent) {
    // absent on a legacy/ungraded concede, read as `better` — the maintenance floor
    const gradeExtant = extant.severity ?? 'better';
    const gradeIntent = input.severity ?? 'better';
    const isRegrade =
      input.intent === 'conceded' && gradeExtant !== gradeIntent;
    // `--why` is required on a dispute and OPTIONAL on a concede — both stances may carry
    // it, so a re-cite is a DECLARED --why that differs from the one on record. gated to
    // `disputed` alone, a re-concede with a revised justification fell through as "the
    // same stance again": the caller's `alreadyOnRecord` short-circuit then skipped the
    // write outright, and the driver's new text was silently dropped — believed recorded,
    // and never was.
    //
    // 🔴 an OMITTED `--why` on a repeat concede is not a re-cite — it is the driver's
    //    argument, unchanged. compare only when the caller passed one: `input.why ===
    //    undefined` reads as "no new opinion this round", never as "cleared to none". a
    //    `--why` that IS passed and equals the fulcrum on record is the identical-repeat
    //    case, and stays a no-op alongside it.
    const isRecite =
      input.why !== undefined && input.why !== (extant.fulcrum ?? null);

    if (!isRegrade && !isRecite) return;

    // a re-grade or a re-cite on an unchanged given: refused, and the fix is named.
    // .why refuse rather than upsert = a stance is final for its given (the same law the
    //      contrary-flip refusal rests on). to upsert would let a driver walk a `better`
    //      concession up to `urgent` on an unchanged given to buy a round, which is the one
    //      move `define.invariant.review.peer.budget.urgent-earns-budget` forbids outright
    throw new BadRequestError(
      [
        isRegrade
          ? `${input.reviewer}'s ${input.about} is already conceded as ${gradeExtant}`
          : `${input.reviewer}'s ${input.about} is already ${extant.status}, with a different --why`,
        ``,
        `declared against ${extant.given}`,
        ...(isRegrade
          ? [
              `  ├─ on record  = --severity ${gradeExtant}`,
              `  └─ you passed = --severity ${gradeIntent}`,
            ]
          : [
              `  ├─ on record  = --why ${extant.fulcrum ?? '(none)'}`,
              `  └─ you passed = --why ${input.why ?? '(none)'}`,
            ]),
        ``,
        `a stance is final for its given — its GRADE and its ARGUMENT included. that given is`,
        `unchanged, so the stance stands:`,
        `  ├─ change the artifact and re-arrive, then take a stance on the new given`,
        `  └─ or ask a human to void it now`,
        `     └─ rhx route.stone.set --stone ${input.stone} --as rewound`,
      ].join('\n'),
      {
        reviewer: input.reviewer,
        about: input.about,
        given: input.given,
        extant: extant.status,
        intent: input.intent,
        ...(isRegrade
          ? { severityExtant: gradeExtant, severityIntent: gradeIntent }
          : { fulcrumExtant: extant.fulcrum, fulcrumIntent: input.why }),
      },
    );
  }

  // a contrary stance on an unchanged given: refused, and the fix is named
  throw new BadRequestError(
    [
      `${input.reviewer}'s ${input.about} is already ${extant.status}`,
      ``,
      `declared against ${extant.given}`,
      ...(extant.fulcrum ? [`  └─ why = ${extant.fulcrum}`] : []),
      ``,
      `a stance is final for its given. that given is unchanged, so the stance stands:`,
      `  ├─ change the artifact and re-arrive, then take a stance on the new given`,
      `  └─ or ask a human to void it now`,
      `     └─ rhx route.stone.set --stone ${input.stone} --as rewound`,
    ].join('\n'),
    {
      reviewer: input.reviewer,
      about: input.about,
      given: input.given,
      extant: extant.status,
      intent: input.intent,
    },
  );
};
