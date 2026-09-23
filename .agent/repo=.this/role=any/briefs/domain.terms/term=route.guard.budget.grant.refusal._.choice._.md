# domain.term: refusal

term.chosen   = refusal
term.kind     = noun
term.boundary = route.guard.budget.grant
term.synonyms.forbidden:
- rejection
- denial
- block
- error
- failure

## .what
a **refusal** is the verdict a budget grant gets when a conjunct did not hold, plus the facts its
remedy needs. it is a closed set of three, and each names a different conjunct that failed:

| the kind | the conjunct that failed | what it carries |
|---|---|---|
| `stone-matched-many` | the **scope** | the guards `--stone` reached |
| `no-warrant` | the **warrant** | — |
| `rounds-remain` | the **moment** | the meters in scope |

🔴 **a refusal is ACTIONABLE, and that is what parts it from an error.** it exits 2, names what to
run instead, and a bare retry refuses identically — so the caller must converge, grade a concern
urgent, or re-scope. an error exits 1 and may be transient.

🟡 **a refusal carries its own facts rather than a message.** the renderer states them; it does not
re-derive them. that is what lets one gate and one render disagree about naught.

## .refs
where the term composes declared objects & operations:
- src/domain.operations/route/guard/review/peer/meter/computeBudgetGrantRefusal.ts  # `BudgetGrantRefusal`
- src/domain.operations/route/guard/review/peer/meter/formatBudgetGrantRefusalLines.ts
- blackbox/driver.route.peer-budget-refusal.acceptance.test.ts     # all three kinds, through the real cli

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.budget.grant.refusal._.choice.reason.md` — etymology, why not `rejection`/`denial`,
  and the refusal-vs-error line
