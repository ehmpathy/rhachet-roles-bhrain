# domain.term.choice.reason: guard

## .etymology

**guard** — one who watches a passage and decides who may cross. the word carries **agency**,
which is the property that earns it here: a guard does not merely exist at a boundary, it
**evaluates** and then permits or refuses.

that agency is real in the code. a guard runs reviews, dispatches judges, tallies verdicts, and
may await a human's clearance. it is an actor with a budget, not a condition on a branch.

## .the line — guard vs stone

recorded once, in `term=route.stone._.choice.reason.md`, and cited here rather than restated. the short
form: **the stone marks progress; the guard gates it.** a stone with no guard is ordinary; a gate
with no condition would be pointless.

## .why not the rejected synonyms

- **gate** — names the *aperture*, not the *agent*. a gate is what you pass through; a guard is
  the party that decides whether you may. the whole design — budgets, verdicts, contemplation
  loops, human overrule — is about the decider, not the gap in the wall
- **check** — far too small. `check` reads as a single boolean test, where a guard orchestrates
  self-reviews, peer-review ladders, judges, and approval gates, each with its own budget and
  terminal states. it also collides with the ordinary verb, which appears throughout the codebase
- **validator** — implies a **pure predicate** over an artifact: valid or invalid. a guard's
  outcomes are richer and not all judgments (`approved`, `rejected`, `exhausted`, `malfunction`,
  `constraint`) — and `malfunction` in particular is explicitly *"the absence of any verdict"*
  (`term=malfunction`), which no validator can express
- **gatekeeper** — the closest in sense, and rejected on shape: it is compound, longer, and breaks
  the one-word trail vocabulary the route domain shares (`route`, `stone`, `guard`, `pave`)
- **barrier** — passive and permanent. a barrier blocks; a guard **decides**, and most of the time
  it lets you through

## .disputes

none. the noun predates this capture, and `checkpoint` was already forbidden as a synonym of
`stone` on the grounds that it encroached on this term's job — so the boundary has been defended
once already, from the other side (see `term=stone`'s 2026-07-22 dispute).

## .evidence

- **code**: `RouteStoneGuard.ts` declares it; `GuardProgressEvent.ts` and the six
  `RouteStoneGuard*` artifact objects compose it; `src/domain.operations/route/guard/` is a whole
  operation namespace; `route.guard.budget.sh` and `route.guard.upgrade.sh` declare it in skills
- **the agency is observable**, which is what settles `gate`/`barrier`: a guard holds a **budget**
  (`RouteStoneGuardReviewPeerMeter`), reaches **terminal** states (`term=terminal`), can
  **malfunction** (`term=malfunction`), and can be **overruled** by a human (`term=overrule`,
  `term=forgive`). a passive aperture has none of those
- **it is the mechanism that made this very round possible**: stone `1.vision`'s guard ran four
  self-reviews and then halted for human approval — a halt no validator could express, since
  *"wait for human approval"* is neither valid nor invalid
- **invariant:** `guard` names a domain object and operation namespace declared in THIS repo — not
  generic english like `check`
