import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';

/**
 * .what = the slice of a peer meter the grant gate reads
 * .why = the gate asks one question of a reviewer — has it run dry? — so it takes the four fields
 *        that answer it and no more. a narrow input keeps the transformer pure and its tests
 *        free of the twelve fields `GuardPeerMeterStatus` carries for display.
 *
 * 🔴 .it is a `Meter`, and it is NOT a `Lane`.
 *    `lane` is a DECLARED FORBIDDEN SYNONYM of `reviewer`
 *    (`term=route.guard.review.reviewer._.choice._.md:7`), and a type name is a contract, where
 *    `rule.forbid.domain-term-synonyms` bites. the word that fits is the extant one: this shape is
 *    `Pick<GuardPeerMeterStatus, …>`, it sits in `peer/meter/`, and the ledger it is read from is
 *    `reviewPeerMeters.jsonl`. ⇒ `meter` was already the repo's word for `{slug, level, rounds,
 *    budget}` and needed no coinage (`rule.always.reuse-pavement-before-improvise`).
 *
 * ⚠️ .the pull toward `lane` is REAL, and the glossary already names it as an OPEN GAP rather
 *    than a live dispute: `reviewer` carries both the ROLE and one RUN of it, the `lane` dispute
 *    took the INCONSISTENCY repair in 2026-09, and *"the run-sense still has no word of its own"*
 *    (`term=route.guard.review.reviewer._.choice.reason.md`, the section after the verdict).
 *    ⇒ this design wanted the run-sense and reached for the meter instead, which is the shape it
 *    actually holds. no new dispute is owed — the gap is recorded, and a resolved dispute
 *    re-opened would be a second index over one question.
 */
export type BudgetGrantMeter = Pick<
  GuardPeerMeterStatus,
  'slug' | 'level' | 'rounds' | 'budget'
>;

/**
 * .what = why a budget grant is refused, or null where it is permitted
 * .why = a refusal carries the facts its remedy needs, so the renderer states them rather than
 *        re-derives them. three variants, and each names a different conjunct that failed.
 *
 * 🔴 .the discriminant is `kind`, never `reason`.
 *    `reason` is already taken in this exact subsystem, for a DIFFERENT concept: free-text prose.
 *    `PassageReport.reason` carries `"peer reviewer budget exhausted: mech-rules"`, and
 *    `asConcessionReasonDisplay` PARSES that prose. ⇒ one word over a closed tag and an open
 *    string is `rule.forbid.domain-term-ambiguity`, and the two senses would meet in one directory
 *    (`formatBudgetGrantRefusalLines` sits beside `formatBlockRemedyGroups`, which reads the prose
 *    sense).
 *
 * 🟡 .`kind` is the extant word for "which variant", not a coinage — `stepRouteStatusLine.ts:62`
 *    and `ReviewConcernRef.kind`. ⚠️ and the repo's discriminant vocabulary is NOT settled: it
 *    also holds `verdict` (`getMemoryGuardVerdict.ts:96`) and `type` (`guard/upgrade/`'s own
 *    union). so this picks the most-used of three rather than conforms to a canon, and the
 *    absent canon is a real gap the glossary does not yet hold.
 */
export type BudgetGrantRefusal =
  | { kind: 'stone-matched-many'; guards: string[] }
  | { kind: 'no-warrant' }
  | { kind: 'rounds-remain'; meters: BudgetGrantMeter[] };

/**
 * .what = whether a reviewer has run DRY — no round in hand, so it cannot run again without a grant
 * .why = the gate's moment conjunct asks about CAPACITY, and capacity is `rounds >= budget`.
 *
 * 🔴 .the name is the RULED design's own words — *"∧ the target reviewer has run dry ← the
 *    moment"* (`1.vision.yield.md`). it reads the reviewer's state off its meter, so the subject
 *    is the reviewer and the input is the meter, and both say so.
 *
 * 🔴 .it is deliberately NOT the meter's `verdict: 'exhausted'`, and the two are different
 *    questions that share one word:
 *
 *    | the read | asks | a reviewer at 8/8 that just RAN |
 *    |---|---|---|
 *    | `verdict === 'exhausted'` | was it SKIPPED for budget this generation? | no — `rejected` |
 *    | here | has it a round left to spend? | **yes, it is dry** |
 *
 *    ⇒ the verdict form requires `!hasReviewForCurrentHash`, and `getAllReviewPeerMeterStatuses`
 *    forbids its relaxation for a real reason — it would unlock the level above a pass early.
 *    but that narrower read would refuse a grant in exactly the cell this design exists to
 *    permit: the reviewer that spent its last round to RAISE a concern and has none left to
 *    CONFIRM the repair. so the capacity read is the right one here, and the name says `dry`
 *    rather than `exhausted` so no reader takes it for the verdict
 *    (`rule.forbid.domain-term-ambiguity`).
 *
 * 🔴 .it is EXPORTED so the refusal renderer reads the same predicate the gate does.
 *    the warrant refusal offers *"grade a concern urgent"*, and that remedy lands only where the
 *    moment conjunct would also pass — so the renderer must ask this same question to know whether
 *    its own advice unblocks. ⇒ a second, inline `rounds >= budget` there would be two sources of
 *    truth for one rule, and this one carries a non-finite branch a re-spell would drop
 *    (`rule.require.single-source-of-truth-for-render`).
 *
 * ⚠️ .the `!Number.isFinite` branch changes no OUTCOME, and that is stated rather than overclaimed.
 *    `rounds >= Infinity` and `rounds >= NaN` are each already `false`, so a raw compare agrees on
 *    every budget the parser can produce. what the branch buys is that this predicate and its
 *    display twin `asMeterSpendLine` read the non-finite case in the SAME shape — the twin's tail
 *    does diverge without it (`NaN - NaN > 0` is false, so it would print `budget spent` for a
 *    reviewer this predicate calls live). ⇒ the same twin discipline
 *    `formatRouteGuardReviewPeerAbsorptionAck` keeps between its own `spent` and
 *    `asReviewerMeterLine` (r007 blocker.4).
 */
export const hasReviewerRunDry = (input: {
  meter: BudgetGrantMeter;
}): boolean =>
  !Number.isFinite(input.meter.budget)
    ? false
    : input.meter.rounds >= input.meter.budget;

/**
 * .what = the three-conjunct gate on `rhx route.guard.budget --for review --add N`
 * .why = the budget IS the allowance for `better` churn. inside the meter, taste counts; past the
 *        meter, only a nameable harm buys a round. so a grant past a spent meter is refused unless
 *        the round was EARNED, and the earned path is a conjunction of three:
 *
 * ```
 * permitted  ⟺  a live urgent concession stands       ← the warrant
 *             ∧ the target reviewer has run dry       ← the moment
 *             ∧ --stone resolved to exactly one stone ← the scope
 * ```
 *
 * 🔴 .the ORDER is load-bearing, and it is scope → warrant → moment.
 *    a multi-match `--stone` is ambiguous about WHICH stone's ledger to read, so it must be
 *    refused BEFORE the warrant is read rather than after — read it after and the gate has
 *    already answered a question the invocation never posed. the warrant then precedes the
 *    moment because it is the cheaper diagnosis for the driver: *"no round was earned"* is
 *    actionable on its own, where *"rounds remain"* is only useful once a warrant stands.
 *
 * 🔴 .the moment conjunct asks whether ANY target reviewer has run dry, never whether EVERY one
 *    has. a bare `--add` scopes to the latest level, which may hold a mix — one reviewer spent,
 *    one live. to demand every one be dry would make the bare form unusable the moment two
 *    diverge, and the refusal it exists to make (a preemptive pad) is already made by the
 *    single-reviewer case a `--peer` grant produces. ⇒ a mixed level grants, and the live
 *    reviewer in it is padded. that residual is F10's, recorded rather than closed.
 *
 * ⚠️ .the warrant is read as a BOOLEAN, never as a count.
 *    `getStoneLiveUrgentConcessionSlugs` dedupes by REVIEWER — its own comment says why, and it
 *    is a different purpose than this one. so its length counts REVIEWERS rather than harm, and a
 *    size cap built on it would grant five rounds for one concern spread across five reviewers
 *    and one round for five concerns in a single reviewer. the boolean read is unaffected by a
 *    dedupe; a count read would not be.
 *
 * ⚠️ .it fails CLOSED on an unsevered stance.
 *    `PassageReport.severity` is optional, so a row written before the field existed carries
 *    none. the caller's `severity === 'urgent'` filter drops it, which is the safe direction —
 *    a `severity !== 'better'` form reads as the same intent and would fail OPEN on every
 *    legacy row.
 */
export const computeBudgetGrantRefusal = (input: {
  /** the guard files `--stone` resolved to. more than one is an ambiguous invocation */
  targetGuards: string[];
  /** the reviewers with a live urgent concession on this stone. read as a boolean */
  liveUrgentSlugs: string[];
  /** the meters this write would touch, already scoped by `--peer` / `--level` */
  targetMeters: BudgetGrantMeter[];
}): BudgetGrantRefusal | null => {
  // the SCOPE — one invocation, one stone. `--stone` matches by prefix, so `5` names `5.1`,
  // `5.2`, and `5.3` at once, and one stone's warrant would buy rounds on three (F022 fork E,
  // applied to the stone field rather than the level).
  if (input.targetGuards.length > 1)
    return { kind: 'stone-matched-many', guards: input.targetGuards };

  // the WARRANT — a round is earned by a recorded harm claim on the last round, never by a wish
  // to continue. a `better` concession is maintenance, and maintenance earns no round.
  if (input.liveUrgentSlugs.length === 0) return { kind: 'no-warrant' };

  // the MOMENT — a reviewer with rounds in hand needs no grant, so a pad before the bound bites
  // is the bound removed in advance. an empty scope holds no live reviewer, so it falls here too.
  //
  // 🟡 it is a `.some`, never a `.filter` whose length is then read. the dry set is not carried
  //    into the refusal — the renderer shows EVERY target meter, so the driver sees the whole
  //    scope it asked for rather than the slice that failed. ⇒ a filtered array would be an
  //    allocation named for a value nobody uses, and `.some` says the question outright.
  if (!input.targetMeters.some((meter) => hasReviewerRunDry({ meter })))
    return { kind: 'rounds-remain', meters: input.targetMeters };

  return null;
};
