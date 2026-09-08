# domain.term: given

term.chosen   = given
term.kind     = noun                 # noun | verb | adj — reused across objects & operations
term.boundary = review
term.synonyms.forbidden:
- critique
- feedback
- comment
- issue
- report          # `.report.md` is a DIFFERENT artifact beside the given — never a synonym

## .what

**what a peer reviewer hands over: one round's verdict on a stone, at one artifact hash.**

it carries the numeric blocker and nitpick counts the guard parses (`contract.reviewer-output`),
and it is the half of the review conversation the **reviewer** authors. its counterpart is the
`taken`, which the driver authors.

a given lands at a computed path that encodes the iteration, the hash, the round, and the reviewer
slug:

```
$route/.reviews/peer/$stone._.review.i$NNN.$hash.r$NNN._.given.by_peer.$slug.md
```

🔴 **that whole path is the given's IDENTITY — no subset of it is.** in particular
`(slug, hash)` is not: a `.taken` write does not move the artifact hash, so one reviewer's
successive givens routinely share a hash and differ only by iteration. any operation that must say
*which* given it means says so with the path.

⚠️ **a `.report.md` sits beside a given and is not one.** `enumRouteGuardReviewPeerFiles.ts:50`
excludes it, so the count of givens is never inflated by the detail file that accompanies each.

⚠️ **`given` here is the REVIEWER's artifact, never the BDD `given:`** of a gherkin timeline. the
boundary segment `review` is what parts them, and it is why the term is
`route.guard.review.given` rather than a bare `given`.

## .refs

- `src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeerGivens.ts`
- `src/domain.operations/route/guard/review/peer/getLatestPeerGivensPerSlug.ts`
- `src/domain.operations/route/guard/review/peer/enumRouteGuardReviewPeerFiles.ts`
- `src/domain.operations/route/guard/review/peer/enumRouteGuardReviewPeerConversationFiles.ts`
- `src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerContemplationStatus.ts`

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.review.given._.choice.reason.md` — etymology, the give/take pair, evidence
