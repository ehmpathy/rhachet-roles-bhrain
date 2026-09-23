import { given, then, when } from 'test-fns';

import {
  type BudgetGrantMeter,
  computeBudgetGrantRefusal,
} from './computeBudgetGrantRefusal';

// build a minimal meter (the gate reads only rounds + budget; slug + level ride the refusal)
const asMeter = (input: Partial<BudgetGrantMeter>): BudgetGrantMeter => ({
  slug: 'mech-rules',
  level: 1,
  rounds: 4,
  budget: 4,
  ...input,
});

/**
 * .what = the three-conjunct gate on a budget grant
 * .why = the budget is the only bound that makes a review round cost, and a lever any driver may
 *        pull is a bound any driver may raise. these clamp each conjunct, and the order between
 *        them, so a future edit cannot quietly restore the free lever.
 */
describe('computeBudgetGrantRefusal', () => {
  given('[case1] a warrant, a dry reviewer, and one stone', () => {
    when('[t0] the gate is asked', () => {
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['5.1.execution.guard'],
        liveUrgentSlugs: ['mech-rules'],
        targetMeters: [asMeter({ rounds: 4, budget: 4 })],
      });

      then('it is PERMITTED — every conjunct holds', () => {
        expect(refusal).toEqual(null);
      });
    });
  });

  given('[case2] no live urgent concession', () => {
    when('[t0] the reviewer has run dry', () => {
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['5.1.execution.guard'],
        liveUrgentSlugs: [],
        targetMeters: [asMeter({ rounds: 18, budget: 18 })],
      });

      then('it is refused — the round was not earned', () => {
        expect(refusal).toEqual({ kind: 'no-warrant' });
      });
    });

    // a `better` concession never earns budget, so a ledger of `better` stances alone reads to
    // this gate exactly as an empty one does — the caller filters on severity before it calls
    when('[t1] the driver conceded, but graded it better', () => {
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['1.vision.guard'],
        liveUrgentSlugs: [],
        targetMeters: [asMeter({ slug: 'ergo-rules', rounds: 3, budget: 3 })],
      });

      then('it is refused all the same', () => {
        expect(refusal).toEqual({ kind: 'no-warrant' });
      });
    });
  });

  given('[case3] a warrant, but the reviewer still has rounds', () => {
    when('[t0] a grant is sought at 3 of 8', () => {
      const meters = [asMeter({ rounds: 3, budget: 8 })];
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['5.1.execution.guard'],
        liveUrgentSlugs: ['mech-rules'],
        targetMeters: meters,
      });

      // F10 — a pad before the bound bites is the bound removed in advance
      then('it is refused — rounds remain', () => {
        expect(refusal).toEqual({ kind: 'rounds-remain', meters });
      });
    });

    when('[t1] the scope holds no reviewer at all', () => {
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['5.1.execution.guard'],
        liveUrgentSlugs: ['mech-rules'],
        targetMeters: [],
      });

      then('it is refused — an empty scope holds no dry reviewer', () => {
        expect(refusal).toEqual({ kind: 'rounds-remain', meters: [] });
      });
    });

    // 🔴 the conjunct asks whether ANY target reviewer has run dry, never whether EVERY one has.
    //    a bare `--add` scopes to a whole level, which may hold a mix — to demand every one be
    //    dry would make the bare form unusable the moment two diverge
    when('[t2] one reviewer of the level is dry and one is live', () => {
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['5.1.execution.guard'],
        liveUrgentSlugs: ['mech-rules'],
        targetMeters: [
          asMeter({ slug: 'mech-rules', rounds: 4, budget: 4 }),
          asMeter({ slug: 'ergo-rules', rounds: 1, budget: 6 }),
        ],
      });

      then('it is PERMITTED — one dry reviewer suffices', () => {
        expect(refusal).toEqual(null);
      });
    });
  });

  given('[case4] --stone matched several stones', () => {
    // F022 fork E, applied to the stone field: a warrant covers ONE stone, and `--stone 5` names
    // `5.1`, `5.2`, and `5.3` at once, so one stone's warrant would buy rounds on three
    when('[t0] a prefix names three guards', () => {
      const guards = [
        '5.1.execution.guard',
        '5.2.review.guard',
        '5.3.ship.guard',
      ];
      const refusal = computeBudgetGrantRefusal({
        targetGuards: guards,
        liveUrgentSlugs: ['mech-rules'],
        targetMeters: [asMeter({ rounds: 4, budget: 4 })],
      });

      then('it is refused, and it names what it matched', () => {
        expect(refusal).toEqual({ kind: 'stone-matched-many', guards });
      });
    });

    // 🔴 the ORDER — a multi-match is ambiguous about WHICH stone's ledger to read, so it is
    //    refused BEFORE the warrant is judged. judged after, the gate answers a question the
    //    invocation never posed
    when('[t1] the prefix matches many AND no warrant stands', () => {
      const guards = ['5.1.execution.guard', '5.2.review.guard'];
      const refusal = computeBudgetGrantRefusal({
        targetGuards: guards,
        liveUrgentSlugs: [],
        targetMeters: [asMeter({ rounds: 4, budget: 4 })],
      });

      then('the SCOPE is what it names, never the warrant', () => {
        expect(refusal).toEqual({ kind: 'stone-matched-many', guards });
      });
    });
  });

  /**
   * 🔴 .the two demoed critipaths whose VERDICT this gate renders, and whose demos ask for a
   *    richer diagnosis than the union carries (`case=6` the broken lane, `case=8` the dispute
   *    that earns naught).
   *
   *    `BudgetGrantRefusal` has exactly three kinds — `stone-matched-many`, `no-warrant`,
   *    `rounds-remain` — and NO disputed or malfunctioned variant. so the copy those demos sketch
   *    is not merely unwritten: it is unreachable from this gate's inputs, since the caller hands
   *    over `liveUrgentSlugs` alone and a dispute mints none.
   *
   * ⇒ what the demos PROMISE as a verdict is what these clamp. the cut to that copy is recorded
   *    in each demo's own verification section, and the enrichment is caught as a dream.
   */
  given('[case6] the two demoed cells, at the verdict grain', () => {
    // `case=8` — a dispute is the loudest engagement the ladder has, and it earns no round.
    // `getStoneLiveUrgentConcessionSlugs` filters to conceded+urgent, so a disputed stance reaches
    // this gate as an EMPTY warrant list — the same input an untouched stone produces
    when('[t0] the stone carries a dispute and no concession', () => {
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['5.1.execution.guard'],
        liveUrgentSlugs: [],
        targetMeters: [asMeter({ rounds: 3, budget: 3 })],
      });

      then('it is refused on the WARRANT — a dispute concedes naught', () => {
        expect(refusal).toEqual({ kind: 'no-warrant' });
      });
    });

    // `case=6` — a malfunctioned round draws NO budget (`runStoneGuardReviews.ts:654-656`), so a
    // broken reviewer sits BELOW its allowance and is therefore not dry
    when('[t1] the reviewer malfunctioned, so it drew no round', () => {
      const meters = [asMeter({ rounds: 2, budget: 3 })];
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['5.1.execution.guard'],
        liveUrgentSlugs: ['mech-rules'],
        targetMeters: meters,
      });

      // 🔴 and `rounds-remain` is the RIGHT verdict here, not a near-miss. the demo's own `[t2]`
      //    says so — *"the guard runs the narrowed lane within its EXTANT budget: 1 round left,
      //    and it fits"* — so the remedy the copy prints, `spend the rounds in hand`, is exactly
      //    the move a broken reviewer needs once its guard is narrowed
      then(
        'it is refused on the MOMENT — the round it holds is unspent',
        () => {
          expect(refusal).toEqual({ kind: 'rounds-remain', meters });
        },
      );
    });

    // `case=6` `[t3]` — the same reviewer, also exhausted when it broke. the gate reads B; C never
    // enters, which is what keeps the gate one predicate wide
    when('[t2] the reviewer malfunctioned AND had already run dry', () => {
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['5.1.execution.guard'],
        liveUrgentSlugs: [],
        targetMeters: [asMeter({ rounds: 3, budget: 3 })],
      });

      then('it is refused, and the malfunction changed no verdict', () => {
        expect(refusal).toEqual({ kind: 'no-warrant' });
      });
    });
  });

  given('[case5] a malformed or unlimited meter', () => {
    // 🔴 the !Number.isFinite guard changes no OUTCOME here, and these clamp the outcome anyway.
    //    `rounds >= NaN` and `rounds >= Infinity` are each already false, so a raw compare agrees
    //    on every budget the parser can produce — what the guard buys is that this predicate and
    //    its display twin `asMeterSpendLine` read the non-finite case in the SAME shape, and the twin
    //    DOES diverge without it. ⇒ these two pin the outcome; the twin's own tests pin the shape
    when('[t0] the budget is NaN', () => {
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['5.1.execution.guard'],
        liveUrgentSlugs: ['mech-rules'],
        targetMeters: [asMeter({ rounds: NaN, budget: NaN })],
      });

      then('the reviewer is not dry, so the grant is refused', () => {
        expect(refusal).toMatchObject({ kind: 'rounds-remain' });
      });
    });

    when('[t1] the budget is unlimited', () => {
      const refusal = computeBudgetGrantRefusal({
        targetGuards: ['5.1.execution.guard'],
        liveUrgentSlugs: ['mech-rules'],
        targetMeters: [asMeter({ rounds: 99, budget: Infinity })],
      });

      then('it never spends down, so it is never dry', () => {
        expect(refusal).toMatchObject({ kind: 'rounds-remain' });
      });
    });
  });
});
