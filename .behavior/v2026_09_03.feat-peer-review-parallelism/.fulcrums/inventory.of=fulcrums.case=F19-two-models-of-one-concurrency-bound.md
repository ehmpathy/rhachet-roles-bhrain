# fulcrum F19 — the announce arithmetic and the pour scheduler stay two models of one bound

- rework: **dirty**
- status: open — checked by `[case8]`; extraction dreamed
  (`dreams/v2026_09_13.feat.a-shared-concurrency-bound-topology-both-models-derive-from.md`)
- confidence: **91%**

## .the fork

enroll-impl-arch-defects r011 blocker.1 flags that `getOneReviewLevelPourBound` (the announce
arithmetic) and `runWithinConcurrencyBounds` (the live Bottleneck nest) are two independent
hand-authored models of one topology — a level bound around per-group bounds — kept in step by
comment discipline. two arms:

- **A — extract now**: introduce a pure `getConcurrencyBoundTopology` both consumers derive
  from, so the second formula is deleted.
- **B — check + defer**: add a cross-model property clamp that asserts the two agree, and
  defer the extraction.

## .taken, and why at the time

took **B**. the HARM the reviewer names is a SILENT divergence — the announce claims a cap the
pour does not hold. that harm is closed by a check, without the extraction: `[case8]` in
`runWithinConcurrencyBounds.test.ts` asserts the scheduler's observed peak equals the
arithmetic's announced number across a matrix that covers both dogfood bounds. a divergence now
goes red at unit grain. so arm B removes the harm at once; arm A is a tidiness follow that
deletes the duplication.

## .rework, and why dirty

dirty: arm A re-shapes the contracts of BOTH `getOneReviewLevelPourBound` and
`runWithinConcurrencyBounds`, plus their callers — a teardown of two extant contracts this diff
never opened, not a rename or a default flip.

## .confidence, and why 91 and not higher

91%: the check closes the harm, so the extraction is low-urgency. the 9% is that a future author
could add a THIRD consumer of the topology (a third hand-authored formula) before the extraction
lands, which would re-open the sync burden the check does not itself prevent.

## .where

- `src/domain.operations/route/guard/review/getOneReviewLevelPourBound.ts:23-26`
- `src/domain.operations/route/guard/review/runWithinConcurrencyBounds.ts:109-111`
- the check: `src/domain.operations/route/guard/review/runWithinConcurrencyBounds.test.ts` `[case8]`

## .the verdict once ruled

— (open; for the council)
