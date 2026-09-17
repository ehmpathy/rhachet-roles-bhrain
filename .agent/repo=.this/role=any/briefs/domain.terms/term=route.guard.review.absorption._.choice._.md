# domain.term: absorption (was: stance — SUPERSEDED 2026-09-15)

term.chosen   = absorption
term.kind     = noun                 # noun | verb | adj — reused across objects & operations
term.boundary = review
term.synonyms.forbidden:
- stance          # ⛔ SUPERSEDED — the driver ABSORBS a concern; the recorded disposition is an absorption
- position
- verdict         # ⛔ a verdict is what the JUDGE renders; an absorption is what the DRIVER declares
- decision
- response
- reply

🔴 **`stance` is FORBIDDEN, superseded by `absorption` (S20).** the verb is `absorb` / `setStoneAsAbsorbed`;
the noun for the recorded disposition is `absorption`; its two kinds are `disputed` | `conceded`. the
cluster is renamed to `...absorption.*`; `stance` is kept only as a forbidden synonym.

## .what

**the driver's declared ABSORPTION of ONE concern: `dispute` or `concede`.** to absorb a concern is to
take it up and render its disposition; the recorded disposition is an *absorption*.

it is the genus; `dispute` and `concede` are its only two kinds, and the set is closed by
design — a third would be a driver who neither argues nor agrees, which is silence, and silence is
what an absorption exists to end.

```
rhx route.stone.set --stone <stone> --as disputed --with <reviewer> --about <severity>.<n> --why <path>
rhx route.stone.set --stone <stone> --as conceded --with <reviewer> --about <severity>.<n>
```

## .what parts it from its two neighbours

| the artifact | who authors it | what it says | its grain |
|---|---|---|---|
| a `given` | the **reviewer** | *"here is a concern"* | one round, N concerns |
| a `taken` | the **driver** | *"here is my ANSWER to it"* — a repair or a refutation | one reviewer |
| an **absorption** | the **driver** | *"here is how I took it up"* — argued, or agreed | 🔴 **one concern** |

🔴 **an absorption is not a `taken`, and the two are not substitutes.** a `taken` is prose the reviewer
re-reads; an absorption is a **declaration the judge reads**, and it moves the arithmetic. a driver may
owe both on one concern.

## .the invariants

1. an absorption targets **exactly one** concern — never a lane, never a file, never a reviewer
2. a `dispute` requires a `--why` path to a fulcrum entry; a `concede` requires none
3. one fulcrum entry may back **N** disputes (`1 fulcrum : N disputes`, `1 dispute : 1 concern`)
4. an absorption discharges **only** the concern it names
   (`rule.forbid.suppression-of-undeclared-concerns`)
5. a second absorption on the same concern may agree (idempotent) or contradict (refused) — the
   `absorption-agrees?` rejection invariant

## .refs

- `.behavior/v2026_09_08.feat-dispute-or-concede-review-budget/1.vision.yield.md` — the contract
- `src/domain.objects/Driver/PassageReport.ts` — where `disputed` / `conceded` join the status set

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.review.absorption._.choice.reason.md` — etymology, why `verdict` is forbidden, and
  the closed-set argument
