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

each round a reviewer renders a verdict, one unit is spent. a reviewer with a spent budget reaches
`exhausted`, which is terminal for the unlock ladder — the next rung may run — while the stone
still cannot pass on it. `rhx route.guard.budget --for review --add N --stone <stone>` extends
every reviewer on that stone at once, which is why the driver holds it as its own lever rather than
a human's (`rule.always.spend-own-levers-before-escalation`).

## ⚠️ .a duration ceiling is NOT a budget

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

✅ **`timeout` needs no coinage — this repo already declares it.** it is a `*.guard` key
(`review.timeout`), typed `IsoDuration`, with `DEFAULT_REVIEW_TIMEOUT = 'PT21M'` in both
`runStoneGuardReviews.ts` and `stepReviewBy.ts`. the pavement was already there
(`rule.always.reuse-pavement-before-improvise`).

⚠️ **a live hazard, not a hypothetical.** `.dream/v2026_09_02.fix.llm-suites-inherit-a-90s-default-silently.md`
proposes a shared const for the per-test duration allowance. **it must not be named `*_BUDGET`** —
that would ship the overload into a contract, where `rule.forbid.domain-term-synonyms` bites
hardest. it takes `*_TIMEOUT`.

## .refs

where the term composes declared operations + contracts:

- .agent/repo=bhrain/role=driver/skills/route.guard.budget.sh                        # the published cli
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
