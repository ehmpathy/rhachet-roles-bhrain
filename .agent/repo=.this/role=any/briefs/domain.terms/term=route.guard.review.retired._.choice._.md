# domain.term: retired

term.chosen   = retired
term.kind     = adj
term.boundary = review
term.synonyms.forbidden:
- removed
- deleted
- absent
- gone
- orphaned
- stale

## .what
a peer reviewer is **retired** when it holds an unanswered debt on a stone but no longer appears in
the live guard config. it spoke, it raised a blocker, and it was then taken out of the config — so
it will never run again, and no future round can drop or confirm its critique.

it qualifies the REVIEWER's place in the config, never its verdict. a retired reviewer's given is
untouched: the blocker it raised still gates, and the only discharge is a `.taken` from the driver
or a human overrule. that is the direct consequence of the reviewer-keyed debt — the debt belongs
to the reviewer, so removal of the reviewer cannot clear it.

⚠️ **retired is orthogonal to `unreadable`.** one reviewer can be both, and the reply-prompt then
renders both why/what-to-do branch pairs in one tree. neither adjective implies the other.

it is computed, never stored: `retired: !input.levelBySlug.has(reviewer.slug)`, where `levelBySlug`
is built from the live config. so one given reads `retired` against one config and not against
another — which is correct, because retirement is a fact about the config, not about the file.

in the tree it renders `status = retired from the guard config`.

## .refs
where the term composes declared operations:
- src/domain.operations/route/guard/review/peer/computePeerUncontemplatedUnforgiven.ts   # the `retired: boolean` field on RouteGuardReviewPeerUncontemplated
- src/domain.operations/route/guard/review/peer/asPeerReviewLevelBySlug.ts                # the live-config map its absence is read against
- src/domain.operations/route/guard/tree/formatRouteGuardReviewPeerContemplatePrompt.ts   # renders `status = retired from the guard config` + the why/what-to-do pair

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.review.retired._.choice.reason.md` — why `retired`, not `removed`/`deleted`/`orphaned`
