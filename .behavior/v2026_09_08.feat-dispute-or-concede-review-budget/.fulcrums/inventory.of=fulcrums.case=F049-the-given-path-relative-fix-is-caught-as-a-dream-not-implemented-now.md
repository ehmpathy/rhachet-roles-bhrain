# F049 — the `given` path relative-path fix is caught as a dream, not applied now

## .the fork

the wisher asked mid-verification for `PassageReport.given` (currently stored absolute) to be
stored as a relative path, matching `fulcrum`'s already-relative form. two paths:

- **A** — apply the fix now, in this verification pass: relativize `pathGiven` at its source
  (`getAllRouteGuardReviewPeerGivens.ts`), thread the change through every comparison site that
  keys on it, retrofit `passage.jsonl`, add a regression clamp, re-run the full suite
- **B** — catch the research as a dream, raise this fulcrum, and continue 5.3.verification
  unchanged; the source bug (and the absolute paths already on record in this route's ledger)
  stay as-is

## .taken

**B.** caught as `.dream/v2026_09_16.fix.passage-report-given-is-stored-absolute.md`, symlinked
from this route's `dreams/`.

## .why disputable

the wisher's ask was explicit and the fix is real and worth doing — a reader could reasonably
want it done NOW rather than deferred, especially since it was THEIR ask, not a driver-found
defect.

## .rework

**dirty.** `pathGiven` is a comparison key read by the entrance gate itself
(`getStoneUndeclaredConcerns` → `computeUndeclaredConcernLabels`, `getAbsorptionOnConcern`,
`assertAbsorptionIsNotContrary`) on every future round of every stone. relativizing the stored
value without relativizing the source it's compared against would desync the key and could
silently re-open already-resolved stances — including on this route's own passed stone `5.1`. a
correct fix is a source-level change (`getAllRouteGuardReviewPeerGivens.ts`) with a repo-wide
blast radius across the whole peer-review guard subsystem, not scoped to this feature.

## .confidence

70%. the SAFE/CLEAN read (not safe, not clean, per `rule.always.fix-forward-under-scouts-honor`)
is solid — the comparison-key risk is real and traced through actual code, not speculated. the
uncertainty is whether the wisher would have preferred the risk accepted anyway, given they asked
directly and mid-verification-gate deferral costs them a manual dream review later.
