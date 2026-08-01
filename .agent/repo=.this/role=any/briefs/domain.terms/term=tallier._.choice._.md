# domain.term: tallier

term.chosen   = tallier
term.kind     = noun
term.synonyms.forbidden:
- counter
- method
- decider

## .what
the **tallier** is the role that produced a review's blocker/nitpick count — the discriminant
that records HOW the tally was derived, as a published contract field on a guard review record.
its values are `'deterministic'` (counts read verbatim from the reviewer's own numbers via
regex), `'probabilistic'` (counts read from prose by the fallback sub-brain), or `null` (a
review with no detected verdict — a malfunction carries no tallier).

`tallier` is the **contract-layer** word for this concept. its **internal-layer** twin is
`tactic` — the same discriminant, named for the approach the orchestrator chose to derive the
count inside `getReviewCounts`. this is a deliberate, documented two-layer distinction, not a
drift (see `.reason`).

## .refs
where the term composes declared objects & operations (contract layer):
- src/domain.objects/Driver/RouteStoneGuardReviewArtifact.ts   # the contract field + its rationale
- src/domain.operations/review/runOneReview.ts                 # internal `tactic` cast to contract `tallier`
- src/domain.operations/review.by/ReviewByResult.ts            # ReviewVerdict.tallier
- src/domain.operations/route/guard/tree/formatGuardReviewerTree.ts  # render: `tallied by reviewer@$brain`

## .reason
see the ref-level cluster beside this choice:
- `term=tallier._.choice.reason.md` — etymology, the settled `tactic`/`tallier` layer distinction,
  and the learner-peer dispute that confirmed it
