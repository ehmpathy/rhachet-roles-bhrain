# S20 · `stance` is forbidden, superseded by `absorb`; and the propagation rulings

- **kind** = a term supersession + four propagation rulings (all this-PR scope)
- **said** = 2026-09-15, across the absorb refactor discussion

## .said — verbatim

on the term supersession:

> stance is a forbidden term that was superseded by absorb; propagate this as well

on the `--as` wipe:

> lets ensure that whenever anyone marks anything --as something, this gets wiped; stuck on stone
> 5.1.execution.from_vision after 27 attempts. please tell a human what you saw, where you got
> stuck, and what you tried. and reset / do so now / should be easy / just call a 'setXyz'

on `passage` as the composing root:

> yes, do this too ; ⭐ My recommendation: before the code refactor, rewrite passage to be the
> top-level law that composes the others — PASS requires (a) every guard terminal AND (b) every
> counting concern absorbed AND (c) the residual tally under allowance — and make the gates-map cite
> each sub-law correctly. That makes the six a coherent set with passage as the root

on the invariants' home:

> they need to be moved under the driver role

on the brief sweep:

> review ALL of the driver briefs for coherence and brevity and terseness

on the process:

> itemize all the asks above as tasks, and archive them as seeds, and then do them.

## .settled — the vocabulary, which everything downstream uses

`stance` is FORBIDDEN (a forbidden synonym). the canonical vocabulary:

| role | word | notes |
|---|---|---|
| the verb | **absorb** / `setStoneAsAbsorbed` | render a disposition on one concern |
| the feedback-grain act | **absorb** the feedback — the `.taken`, renamed from `contemplated` to `absorbed` | accepted only once each concern is absorbed |
| the noun (the recorded disposition) | **absorption** | supersedes `stance`. an absorption is of kind `disputed` or `conceded` |
| the values | `disputed` \| `conceded` | the wisher's words — UNCHANGED |
| the gate | **the absorb gate** | was "the stance gate" |

⇒ `ReviewStance` → `ReviewAbsorption`, `getStoneReviewStances` → `getStoneReviewAbsorptions`,
`term=route.guard.review.absorption.*` → `term=route.guard.review.absorption.*`, "the stance gate" → "the
absorb gate", everywhere.

## .settled — the four propagation rulings

1. **`--as` wipes the stuck-streak.** any `route.stone.set --as <verb>` clears the drive-blocker
   count (the "stuck Nx / tell a human" escalation), not only `--as passed`. a driver who marks a
   status is not stuck. the `--as blocked` escalation uses its own separate triggered-report, so this
   never defeats it. `delDriveBlockerState` is called unconditionally at the top of `stepRouteStoneSet`.
2. **`passage` becomes the top-level root law.** `PASS ⟺ (a) every peer guard terminal ∧ (b) every
   concern that counts absorbed ∧ (c) the residual tally under allowance`. the other five invariants
   nest under it as sub-laws; the gates-map cites each correctly.
3. **the invariants live UNDER the driver role.** `define.invariant.review.peer.*` moved from
   `role=any/briefs/` to `src/domain.roles/driver/briefs/`, so a driver boot holds its own system
   laws (no phantom paths). the gates-map is say-level; the invariants are ref, dereferenced from it.
4. **the driver briefs get a coherence + terseness sweep**, post-absorb.

## .landed

- the `--as` wipe: `stepRouteStoneSet.ts` (unconditional `delDriveBlockerState`); the stuck 5.1 state
  file removed to reset the current streak. types green.
- the invariant move + gates-map say-level + wire-up: `src/domain.roles/driver/`.
- still owed: the `passage` rewrite, the `stance`→`absorption` purge, the code rename
  (`setStoneAsStanced`→`setStoneAsAbsorbed`, `contemplated`→`absorbed`, the added absorb gate), the vision
  reframe, the fulcrum rows, and the driver-brief sweep.
