# domain.term: concede

term.chosen   = concede
term.kind     = verb                 # noun | verb | adj — reused across objects & operations
term.boundary = review.absorption
term.synonyms.forbidden:
- accept
- agree
- acknowledge
- admit
- own

## .what

**one of the two absorptions: the driver agrees that ONE named concern is right, and will repair it.**

```
rhx route.stone.set --stone <stone> --as conceded --with <reviewer> --about nitpick.1
```

🔴 **it changes the tally not at all.** that is the whole point of the pair: a dispute sheds a
concern, a concession keeps it. the stone stays held until the repair lands and the lane re-runs on
the new hash.

🔴 **concede is the DEFAULT, and the repair is owed THIS round.** a concession that is not repaired
this round is a lazy deferral, not a concession — there is no *"later, it's minor"* door. the fix
lands now, or the concern earns a dispute (WRONG, or MASSIVELY DIRTY), never a *"meh, not now."*
(`rule.forbid.lazy-review-deferrals`).

⇒ so a concession is **not** a way past the gate. it is the declaration that the driver read the
concern, agrees, and owes the repair — which is what makes the un-declared concern detectable.

## .why it is owed at all, if it moves naught

three jobs, and no other artifact does them:

- it **ends the silence** — the gate refuses a stone with an undeclared concern, and a driver who
  agrees must still say so
- it **bounds the dispute** — a lane at 4 concerns with 1 dispute and 3 concessions is fully
  declared; a lane with 1 dispute and 3 silences is not
- it **states the debt** — the halt can then name what is still owed, by position

## .the invariants

1. it targets **exactly one** concern
2. it requires **no** `--why` — an agreement needs no argument
3. it removes **naught** from the tally
4. it claims **only** the concern it names — 🔴 a lane-grain concession would commit the driver to
   concerns they never read, which is this defect's mirror
   (`rule.forbid.suppression-of-undeclared-concerns`)

## .derived forms — `concession` (noun), `conceded` (adjective)

🔴 **one term, three grammatical forms — never three concepts.** `concede` is the act (verb);
`concession` is the act named as a noun (e.g. *"a live urgent concession"*); `conceded` marks
the state it leaves a concern in (adjective, the `PassageReport.status` value). the same
precedent already holds for `absorb`/`absorption`/`absorbed` (`term=route.guard.review.absorption`)
— one cluster, not a cluster per grammatical form.

`concession` composes several declared operations that read the AGGREGATE of a lane's live
concede-stances, over any single one: `ConcessionExhaustionKind` (`none | better | urgent`),
`computeConcessionExhaustionKind`, `getStoneConcessionExhaustionKind`,
`getStoneLiveUrgentConcessionSlugs`, `asConcessionReasonDisplay`. these read `severity` across
every concession on a lane to grade whether an exhaustion halt is an ordinary human wait or a
driver-owned top-up (`term=route.guard.review.absorption.concede.severity`).

## .refs

- `.behavior/v2026_09_08.feat-dispute-or-concede-review-budget/1.vision.yield.md`
- `1.vision.experience.case=11` — the lane the driver answers two ways at once
- `src/domain.operations/route/guard/review/peer/getStoneConcededLaneSlugs.ts` —
  `ConcessionExhaustionKind`, `computeConcessionExhaustionKind`, `getStoneConcessionExhaustionKind`
- `src/domain.operations/route/guard/review/peer/getStoneLiveUrgentConcessionSlugs.ts`
- `src/domain.operations/route/guard/review/peer/asConcessionReasonDisplay.ts`

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.review.absorption.concede._.choice.reason.md` — etymology, why `accept` and `agree`
  lost, and the over-claim mirror
