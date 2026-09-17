# fulcrum F18 — findsertRouteGitignore stays an un-hoisted per-lane writer

- rework: **dirty**
- status: open — dream caught (`dreams/v2026_09_13.fix.findsert-route-gitignore-is-an-unhoisted-cross-lane-writer.md`)
- confidence: **90%**

## .the fork

arch-hazards-behavior r007 nitpick.3 flags that `findsertRouteGitignore` runs an unlocked
read-then-write on a route `.gitignore`, still invoked from per-lane code
(`setRouteStoneGuardReviewPeerMeter`), so concurrent lanes can each read-then-write it.
its peer `findsertReviewPeerGitignore` was already hoisted to one writer per pass; this
one was not. two arms:

- **A — hoist now**: lift the call to the single per-pass setup beside its peer, so one
  writer touches the file per pass.
- **B — defer**: leave it, catch a dream, record this fulcrum.

## .taken, and why at the time

took **B**. the hoist ripples into the meter-write path
(`setRouteStoneGuardReviewPeerMeter` and its callers), which this diff never opened — so
arm A fails the CLEAN test of `rule.always.fix-forward-under-scouts-honor`. the harm is
benign as it stands: every concurrent writer emits an identical compile-time-constant byte
string, so a lost update leaves the file correct regardless of interleave. no user or
on-call harm ships with the deferral, so it is a nitpick, not a halt.

## .rework, and why dirty

dirty: reversal is not a one-line swap. the hoist moves a write out of a per-lane
operation and into per-pass setup, which re-shapes the meter-write path and its callers —
a teardown of the current call site, not a rename or a default flip. that ripple is the
best-guess estimate this fulcrum records, per the rule's dirt-deferral clause.

## .confidence, and why 90 and not higher

90%: the benign-today read rests on the content as a constant at every call site. if a
future edit makes the route `.gitignore` content vary per lane, the race is no longer
benign and arm A turns urgent. the 10% is that unproven future.

## .where

- `src/domain.operations/route/gitignore/findsertGitignore.ts:32-52`
- caller: `setRouteStoneGuardReviewPeerMeter`

## .the verdict once ruled

— (open; for the council)
