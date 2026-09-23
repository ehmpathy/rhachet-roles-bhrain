# domain.term: review

term.chosen   = review
term.kind     = noun
term.boundary = route.guard
term.synonyms.forbidden:
- audit
- inspection
- critique
- assessment
- evaluation

## .what
a **review** is one examination of an artifact against a declared rubric, which yields a verdict
the guard can read — a count of blockers and a count of nitpicks.

it is the unit of work a **guard** runs. a guard holds levels; a level holds reviewers; a reviewer
runs a review; a review yields a **given**, and the given enumerates **concerns**.

🔴 **a review is the ACT and its verdict, never the party that performs it.** the party is the
`reviewer`, and the artifact the act leaves behind is the `given`. three words, three concepts —
which is why a `given` can be re-read long after its review ran, and why an `unreadable` given is a
review that happened and cannot be scored.

🟡 **it spans BOTH kinds.** a `self` review and a `peer` review are both reviews; the two differ in
who performs the act and what may override it, never in what the act is. so the boundary segment is
`route.guard.review`, and `peer` / `self` sit beneath it.

## .refs
where the term composes declared objects & operations:
- src/domain.objects/Driver/RouteStoneGuardReviewArtifact.ts, ...GuardReviewPeerMeter.ts,
  ...GuardReviewSelfArtifact.ts
- src/domain.operations/route/guard/review/                       # the operation namespace
- src/domain.operations/route/guard/review/computeReviewCompleted.ts
- src/domain.operations/route/guard/review/runOneReview.ts, runStoneGuardReviews.ts
- src/domain.roles/driver/skills/route.review.sh
- it is the boundary segment of 25 extant term clusters — `term=route.guard.review.*`

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.review._.choice.reason.md` — etymology, why not `audit`/`assessment`, and the
  review-vs-reviewer-vs-given line
