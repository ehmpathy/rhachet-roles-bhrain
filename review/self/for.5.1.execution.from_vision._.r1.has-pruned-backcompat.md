# review.self — has-pruned-backcompat (r1)

## .what

hunt the two changed files for backwards-compatibility the wisher never asked for: shims,
optional fields kept "to be safe", dual-shape support, retained old tokens. flag or delete
any that lack an explicit request.

## the scrutiny

### 1. the `asStatusLine` input shape change — CLEAN (no shim)

the `stone` case gained a required `phase` field. i checked whether i kept the old
zero-phase shape alive as a fallback. i did not: `phase` is required, and every caller
(`stepRouteStatusLine`, the unit tests, the acceptance path) passes it. no dual-shape
union, no optional-for-compat field. a caller on the old shape fails at the type boundary —
which is correct, since this repo owns every caller. no backcompat cruft.

### 2. the `🎉` → `🌴🤙` swap — CLEAN (outright swap)

the complete render is a straight replacement. i did not retain `🎉` behind a flag or an
option "in case someone depended on it". the wisher asked for the swap; the swap is total.
no compat path.

### 3. `phase: StatusLinePhase | null` — the null is prescribed, not compat

i questioned whether the nullable phase is a "to be safe" hedge. it is not: the vision's
fault-split prescribes `null` as the explicit degrade target (phase-derivation fault → plain
`🗿 <stone>` line). it is a named state in the contract, not a compat shim for an old caller.
held on prescription, not on caution.

### 4. `route: string | null` — testability seam, not compat

the nullable route lets tests inject a route. it is not backwards compat for a prior
signature — the prior `stepRouteStatusLine` did not exist in this form. it is a hermetic-test
seam (vetted under the YAGNI review). not a compat concern.

### 5. blocker-type coverage — current contract only, no legacy types

`asPhaseFromBlocker` handles exactly the six `RouteStoneGuardBlockerType` values the current
contract defines. i did not add branches for retired or speculative blocker types "for
safety". the `else` returns the non-approval `judge` phase, which is the correct catch for
the one live type left (`'judge'`), not a legacy-swallow. current contract only.

## verdict

no backwards-compatibility was added. the shape change is clean, the emoji swap is total, and
the two nullable fields are prescribed states (degrade target, test seam), not caution-hedges
for old callers. this repo owns every caller of these operations, so a hard shape change is
the right move — no shim earns its keep.

zero deletions. zero flags for the wisher.
