# domain.term: warrant

term.chosen   = warrant
term.kind     = noun
term.boundary = route.guard.budget.grant
term.synonyms.forbidden:
- justification
- reason
- proof
- entitlement
- permission

## .what
a **warrant** is the recorded fact that earns a budget grant: a **live urgent concession** that
stands on the stone. it is the first of the grant's three conjuncts, and the only one the driver can
produce — the moment is a state of the meter, and the scope is a property of the invocation.

| the conjunct | what it asks | who produces it |
|---|---|---|
| the **warrant** | *what harm did you name?* | the **driver**, by `--as conceded --severity urgent` |
| the **moment** | *has the reviewer run dry?* | the meter |
| the **scope** | *did `--stone` name one stone?* | the invocation |

🔴 **a warrant is EARNED, never asserted.** the driver does not write the word; it grades a concern,
and the grade is what the gate reads. so the word names a **fact on the record** rather than a claim
in prose — which is the requirement the wish stated as *"a fact the tool reads, never a judgment a
clone asserts."*

🔴 **a warrant LIVES and LAPSES.** it is keyed to the reviewer's latest `.given`, so a concession
answers the round that raised it and no later one. a lane that spoke again has lapsed its own
warrant; a lane that sat dry still holds its latest.

🟡 **it is not the grant.** a warrant is what the gate reads; a grant is what the gate then permits.
one warrant may be read many times and is consumed by no read — what consumes it is a fresh `.given`
from the lane that minted it.

## .refs
where the term composes declared objects & operations:
- src/domain.operations/route/guard/review/peer/meter/asBudgetGrantWarrantLines.ts
- src/domain.operations/route/guard/review/peer/meter/computeBudgetGrantRefusal.ts  # the `no-warrant` kind
- src/contract/cli/route.ts                                        # `getLiveUrgentWarrantSlugs`
- src/domain.operations/route/guard/review/peer/getStoneLiveUrgentConcessionSlugs.ts  # what a warrant IS, computed

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.budget.grant.warrant._.choice.reason.md` — etymology, why not `justification`
  or `reason`, and why the word names a FACT rather than a claim
