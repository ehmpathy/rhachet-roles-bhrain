# F044 — `feedback` was un-forbidden as a distinct term, not renamed back to `given`

## the fork

repo-rules (r001, i009) blocker.1 claims `feedback` is still a recorded forbidden synonym of
`given`, cites the i003-round `.taken` that once claimed a full `feedback→given` rename, and
demands the whole `feedback*` family (`setStoneAsFeedbackAbsorbed`,
`getRouteGuardReviewPeerFeedbackAbsorptionStatus`, the SDK export, and its dependents) be
renamed back to `given*`.

## taken

dispute. this session, the wisher directly corrected the opposite direction: *"given is not
specific enough; feedback = the full file, which gets given and taken, but default is given.
the real symmetry is between AbsorbedConcern and AbsorbedFeedback."* per
`howto.domain-term-disputes`, a formal dispute was opened and RESOLVED in `feedback`'s favor —
not as a synonym of `given`, but as its own term for a distinct concept: the given+taken PAIR,
over the given alone.

`term=route.guard.review.given._.choice._.md` now states outright: *"`feedback` is no longer on
this list — it names a DISTINCT concept ... see `term=route.guard.review.feedback._.choice._.md`
and this term's `.reason.md` § `.disputes` for the settlement."* the new cluster
(`term=route.guard.review.feedback._.choice._.md` + `.reason.md`) exists on disk, with a full
`.disputes` entry dated 2026-09-16 (raised.by/claim/counter/resolution).

## why disputable

the reviewer's given cites the OLDER i003-round claim from the conversation history as though it
were still current, and does not appear to have read the CURRENT content of
`term=route.guard.review.given._.choice._.md` or the new `feedback` cluster — both state the
opposite of what blocker.1 asserts. the rule it cites (`rule.forbid.domain-term-synonyms`) is
satisfied: the code adopts the CANONICAL term for the concept it holds (`feedback` for the pair,
`given` for the reviewer's half alone), which is exactly what that rule requires once a dispute
resolves in a new term's favor.

## rework

dirty — a rename back to `given*` would undo a deliberate, wisher-corrected decision and would
itself violate `rule.forbid.domain-term-synonyms` in the OTHER direction (`given` for a concept
`feedback` now holds distinctly).

## confidence

92% — the dispute settlement is on disk, dated, and cites the wisher's own words verbatim.
