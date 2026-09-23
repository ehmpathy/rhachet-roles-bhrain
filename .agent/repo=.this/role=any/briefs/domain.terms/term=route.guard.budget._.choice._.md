# domain.term: route.guard.budget

term.chosen   = budget
term.kind     = noun
term.boundary = route.guard   # the review ladder of a guarded stone
term.synonyms.forbidden:
- quota
- allowance
- limit
- cap
- attempts

## .what

a **route.guard.budget** is the count of review **rounds** one peer reviewer may spend on a stone
before it exhausts. it is a **count of rounds, never a span of time.**

- each round a reviewer renders a verdict, one unit is spent
- a reviewer with a spent budget reaches `exhausted`
  - terminal for the unlock ladder — the next rung may run
  - and the stone still cannot pass on it
- `rhx route.guard.budget --for review --add N --stone <stone>` extends the **latest level** of that
  stone — never every reviewer on it
  - a lower level stays exhausted unless `--level` or `--peer` names it
    (`computeBudgetTargetSlugs.ts`, F022 fork E: *"a blanket top-up is forbidden"*)

## 🔴 .a grant is REFUSED by default — the budget is a bound, not a counter

the driver once held the grant as a free lever. it does not (2026-09-18, `.behavior/v2026_09_17.fix-budget-grant-needs-urgent-concession`):

> **the budget IS the allowance for `better` churn. inside the meter, taste counts. past the meter, only `urgent` does.**

⇒ so the route author's `budget: N` is the window they bought with the whole rubric in view, and a grant past it is refused unless the round was **earned**:

```
permitted  ⟺  a live urgent concession stands       ← the warrant
            ∧ the target reviewer has run dry       ← the moment
            ∧ --stone named exactly one stone       ← the scope
```

🔴 **the human path is a DIFFERENT command, and `route.guard.budget` checks no actor at all.** a
human who runs it is refused exactly as a driver is. the human lift sits on
`rhx route.mutate grant allow` — which does check the actor — and it mints the privilege flag a
direct guard edit needs. ⇒ a disjunct written here as *"∨ the caller is a human"* claimed a carve-out
this command does not hold (raised i002/r009 n1, on the identical claim in its `--help`).

🟡 **the lever is still the driver's** — `rule.always.spend-own-levers-before-escalation` keeps it in the driver's column, and rightly. what changed is that a **bar** now stands in front of it, and the bar is a harm claim the driver writes about its own work (`--severity urgent`, the closed set). ⇒ it is a bound a driver may pass, never one a driver may raise.

## 🟡 .a duration ceiling is NOT a budget

the word invites a second sense — *"an allowance you may spend"* reads just as naturally over
seconds as over rounds — and that second sense is a **different concept**, not a shade of this one:

| | this term | the other concept |
|---|---|---|
| **the unit** | rounds, a count | milliseconds, a duration |
| **who spends it** | a reviewer, one verdict at a time | the clock, on its own |
| **what a spent one means** | `exhausted` — a terminal verdict the ladder reads | `Exceeded timeout` — a defect, or a hang |
| **who may extend it** | the driver, mid-drive, per stone | the author, at authorship, per file |

⇒ **a duration allowance is a `timeout`, never a budget.** to call it one collapses a verdict the
ladder acts on into a clock that acts by itself, which is the ABSENT DISTINCTION
`rule.forbid.domain-term-ambiguity` names.

`timeout` needs no coinage — this repo already declares it:

- a `*.guard` key (`review.timeout`), typed `IsoDuration`
- `DEFAULT_REVIEW_TIMEOUT = 'PT21M'` in both `runStoneGuardReviews.ts` and `stepReviewBy.ts`
- ⇒ the pavement was already there (`rule.always.reuse-pavement-before-improvise`)

a live hazard, never a hypothetical:

- `.dream/v2026_09_02.fix.llm-suites-inherit-a-90s-default-silently.md` proposes a shared const for
  the per-test duration allowance
- it must not be named `*_BUDGET` — that would ship the overload into a contract, where
  `rule.forbid.domain-term-synonyms` bites hardest
- ⇒ it takes `*_TIMEOUT`

## .refs

where the term composes declared operations + contracts:

- .agent/repo=bhrain/role=driver/skills/route.guard.budget.sh                        # the published cli
- src/domain.operations/route/guard/review/peer/meter/computeBudgetGrantRefusal.ts   # the three-conjunct gate on a grant
- src/domain.operations/route/guard/review/peer/meter/computeBudgetTargetSlugs.ts    # what a bare `--add` scopes to
- src/domain.operations/route/guard/review/peer/meter/computeReviewPeerVerdict.ts    # spends it, derives exhausted
- src/domain.operations/route/guard/review/peer/meter/getAllReviewPeerMeterStatuses.ts
- src/domain.operations/route/guard/review/runStoneGuardReviews.ts                   # reads it per reviewer
- src/domain.operations/route/guard/upgrade/getBudgetClobberWarnings.ts              # warns a re-stamp would revert a grant
- src/domain.operations/route/guard/tree/formatGuardReviewerTree.ts                  # renders it in the ladder

it is also a declared key in a `*.guard` file (`budget: 5`).

## .reason

see the ref-level cluster beside this choice:

- `term=route.guard.budget._.choice.reason.md` — the etymology, why `budget` over `quota`/`attempts`,
  and the 2026-09-02 duration-sense collision that prompted this cluster
