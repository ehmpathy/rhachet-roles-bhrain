# fulcrum F12 — the blocked-trigger family keeps its four derivations

- **case** = F12
- **title** = the blocked-trigger family keeps its four derivations
- **rework** = clean
- **status** = OPEN
- **confidence** = 80%
- **raised** = 2026-09-18, by the `has-consistent-mechanisms` self review on `5.1.execution.from_vision`

## .the fork, stated fairly

this round's thesis is *remove the derived component from the key, and give the key ONE owner*. it
applied that to the self-review trigger (`getSelfReviewTriggeredPaths`) after the `c8′` class
misfired twice, first-party, on this very stone.

the **blocked** trigger family is the same shape and has no owner. `${stone}.blocked.triggered` is
spelled at four prod call sites:

```
blocked/getBlockedTriggeredReport.ts:16     a path
blocked/setBlockedTriggeredReport.ts:17     a path, spelled again
blocked/delBlockedTriggeredReport.ts:13     a path, spelled again
stones/delStoneGuardArtifacts.ts:46         a GLOB — a different shape
```

| | A — fix it now | B — defer it, with a dream |
|---|---|---|
| the round's thesis | ✅ applied consistently, to every member of the class it named | ⚠️ applied to one member, and the census deferred |
| scope | 🔴 opens a **fourth** subsystem the wish never touched | ✅ the diff stays on the self-review trigger |
| the yield's own scope flag | 🔴 worsened — it already states four deliverables as a split question | ✅ unchanged |
| risk of the deferral | the four could drift apart later, silently | 🟡 real, and **not yet realized** — all four agree today |
| cost to reverse | naught — the dream carries the full shape of the fix | — |

## .taken, and why AT THE TIME

**B — defer, with a dream and this fulcrum.**

the SAFE/CLEAN test of `rule.always.fix-forward-under-scouts-honor` grades the FIX, and it splits:

- **SAFE ✅** — pure path derivation. four extant suites already pin the literal an owner would take
  over, so the clamp exists before the fix does
- **CLEAN 🔴** — it opens `blocked/`, a subsystem this round never touched. the diff today is
  `guard/review/self/`, `guard/tree/`, and two `stones/` operations

⇒ and the weight that settles it is **not** the size of the fix (~15 lines). it is that the round's
own yield already tells the council *"the round delivers four independent repairs to one gate, and
only the first is what the wish set out to do — a scope question the council may want to split."* a
fifth subsystem makes that worse, in a round whose scope is already flagged.

## .rework, and why

**clean.** the deferral is reversible at no cost: the dream carries the call-site table, the fix
shape, and the bite-check recipe. a council that rules A gets the work done with no re-derivation.

⚠️ the *fix* is also clean in the ordinary sense — it ripples to no caller's signature. what makes
it fail the CLEAN question is **which files it opens**, never how they change.

## .confidence, and why it is 80% rather than higher

three things pull it down:

1. 🔴 **the round named the defect class in its own vision** — *"`c8′` is not a one-off defect; it
   is a CLASS"* — and a class named without a census is a claim nobody checked. a council could
   fairly say the census IS in scope precisely because the round made the claim
2. the fix is small enough that "it ripples" reads thin. the honest defence is about **which**
   subsystem, never **how much** code
3. the self-review family's version of this defect **did** misfire twice. the blocked family's has
   not — but that is an argument about luck, and luck is not a mechanism

what holds it at 80% rather than lower: the yield's scope concern is **already on record and
already flagged to the council**, so this is not a new worry invented to justify a deferral.

## .where

- the dream: `.dream/v2026_09_18.fix.the-blocked-trigger-path-is-derived-at-four-call-sites.md`
- linked at: `$route/dreams/v2026_09_18.fix.the-blocked-trigger-path-is-derived-at-four-call-sites.md`
- the peer that DID get an owner: `guard/review/self/getSelfReviewTriggeredPaths.ts`

## .the verdict, once ruled

_unruled._

⇒ if the council rules **A**, the dream holds the whole recipe and the fulcrum closes with it.
⇒ if the council rules **B**, the dream stands as the record and this fulcrum records that the
class was swept and the sweep deliberately deferred — which is the part a future traveler needs,
since an un-swept class and a swept-then-deferred class look identical from the code.
