# domain.term: severity

term.chosen   = severity
term.kind     = noun                 # noun | verb | adj — reused across objects & operations
term.boundary = route.guard.review.absorption.concede
term.synonyms.forbidden:
- priority
- urgency
- weight
- importance

## .what

**the harm grade a concession carries — a closed set of exactly two positions:**

- `better` — the COMMON grade: code idealism, maintenance, polish. it never earns budget; it evolves
  into later as tech debt the budget's floor keeps in check.
- `urgent` — a nameable shipped harm in the closed set **security · safety · monetary · reputation
  · behavioral**. it earns a human's budget grant.

```
rhx route.stone.set --stone <stone> --as conceded --with <reviewer> --about blocker.2 --severity urgent
```

🔴 **it grades a CONCEDE alone, and is REQUIRED there.** a dispute asserts the concern is fine to
continue, so it concedes naught and carries no harm grade — `--severity` on `--as disputed` is
refused. a concede owes one on EVERY concession — `--severity` is a mandatory invariant, so an
UNGRADED concede is refused at the write. ⇒ the requirement is on the WRITE; the ledger READER still
tolerates an ABSENT severity on a legacy row, read as `better` (backward compat, not a write default).

🔴 **`better` is the closed set's default, and it NEVER earns budget.** a budget hit with only
`better` concessions is good enough — the stone proceeds, no human, no more budget. a live `urgent`
concession is the ONE case that needs increased budget and warns the human this PR.

⇒ so a severity is not a knob the driver turns for attention. it is the answer to the reviewer's own
harm test (`rule.forbid.overzealous-blockers`): name the harm that ships → `urgent`; you cannot →
`better`. the strong bias is to `better`.

## .the invariants

1. the set is **closed** — exactly two positions, `better` and `urgent`, and no third
2. `--severity` is **REQUIRED on the write** — a mandatory invariant, no ungraded concede. the
   ledger READER tolerates an absent severity on a legacy row, read as `better` (backward compat)
3. `better` **never** earns increased budget — it must not weigh the team down
4. `urgent` requires a **nameable shipped harm** in the closed set security · safety · monetary ·
   reputation · behavioral — code idealism is never urgent
5. it grades a **concede** only — absent on a dispute always

## .refs

- `src/domain.objects/Driver/PassageReport.ts` — the `severity?: 'better' | 'urgent'` ledger field
  (only for status='conceded')
- `src/domain.operations/route/guard/review/peer/getStoneReviewAbsorptions.ts` —
  `ReviewAbsorption.severity`
- `src/domain.operations/route/stones/setStoneAsConcernAbsorbed.ts` — requires `--severity` on a
  concede (no default; an ungraded concede is refused), refuses it on a dispute
- `src/contract/cli/route.ts` — the `--severity <sev>` flag (only for `--as conceded`)
- `src/domain.operations/route/guard/review/peer/getStoneConcededLaneSlugs.ts` —
  `computeConcessionExhaustionKind` reads it to grade the halt three-way (`none` · `better` · `urgent`)
- `src/domain.operations/route/guard/review/peer/getStoneLiveUrgentConcessionSlugs.ts` — names the
  human a live `urgent` concession owes a budget grant

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.review.absorption.concede.severity._.choice.reason.md` — etymology, why `priority`,
  `urgency`, and `weight` lost, and the closed-set invariant
