# domain.term: grant

term.chosen   = grant
term.kind     = noun
term.boundary = route.guard.budget
term.synonyms.forbidden:
- topup
- extension
- increase
- bump
- credit

## .what
a **grant** is one permitted raise of a reviewer's budget — the act, and the fact that it was
earned. `rhx route.guard.budget --for review --add N` requests one; the gate permits or refuses it.

🔴 **a grant is EARNED, never taken.** the word was chosen because it names what another party
allows. the three conjuncts are what the driver must show — a live urgent concession (the warrant),
a reviewer that has run dry (the moment), and a `--stone` that named one stone (the scope) — and a
request that shows them is granted while one that does not is refused.

🟡 **the grant NAMES its warrant on success.** a granted raise prints which concession earned it, so
a council reads the trade rather than a bare counter bump.

🟡 **it is not the `route.mutate grant` privilege flag**, which is a different concept under a
different boundary — that one gates a WRITE to the route's own files, and it is the command that
checks the caller's actor. the collision is real and both words are right in their own seat; a
contract that means one must say which boundary it sits under.

## .refs
where the term composes declared objects & operations:
- src/domain.operations/route/guard/review/peer/meter/computeBudgetGrantRefusal.ts  # `BudgetGrantMeter`, `BudgetGrantRefusal`
- src/domain.operations/route/guard/review/peer/meter/asBudgetGrantWarrantLines.ts
- src/contract/cli/route.ts                                        # `routeGuardBudget`, the gate + the emit
- .agent/repo=bhrain/role=driver/skills/route.guard.budget.sh      # the published cli

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.budget.grant._.choice.reason.md` — etymology, why not `topup`/`increase`, and
  the collision with `route.mutate grant`

## .see also
- `term=route.guard.budget.grant.warrant._.choice._.md` — the **warrant**, the one conjunct a driver
  produces. a grant is what the gate permits; a warrant is what the gate reads
- `term=route.guard.budget.grant.refusal._.choice._.md` — the refusal, this term's mate
