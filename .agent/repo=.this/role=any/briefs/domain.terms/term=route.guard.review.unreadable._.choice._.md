# domain.term: unreadable

term.chosen   = unreadable
term.kind     = adj
term.boundary = review
term.synonyms.forbidden:
- unparseable
- invalid
- malformed
- empty
- blank
- uncounted

## .what
a peer **given** is **unreadable** when its stdout carried no numeric count for both dimensions, so
no verdict was ever seen. it qualifies the ARTIFACT the reviewer produced, never the reviewer.

🔴 **an unreadable given GATES.** `contract.reviewer-output` states the reason outright: *"if it
finds no numeric count it can NOT assume zero. a silent 0/0 would look like a clean approval when
in truth no verdict was seen."* so `asPeerGivenVerdict` scores an unreadable given `blockers: 1` —
a **fabricated** count, chosen so the gate holds rather than opens.

⚠️ that fabrication is why the word must appear in the render. the tree prints
`verdict = unreadable — no numeric count found` rather than `1 blocker`, because *"1 blocker"*
would tell the driver the guard read a verdict when it read none, and send them to hunt a blocker
that was never raised. **the failhide the fabricated count prevents at the gate would be re-hidden
at the surface.**

⚠️ **unreadable is orthogonal to `retired`.** one reviewer can be both, and the reply-prompt then
renders both why/what-to-do branch pairs in one tree. neither adjective implies the other.

the debt it mints is answerable like any other: the driver writes the `.taken` and names the
malfunction in it. an unreadable reviewer does not deadlock a stone.

## .refs
where the term composes declared operations:
- src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeerGivens.ts   # the `unreadable: boolean` field on RouteGuardReviewPeerGiven
- src/domain.operations/route/guard/review/peer/asPeerGivenVerdict.ts                  # fabricates `blockers: 1` when no count was read
- src/domain.operations/route/guard/tree/formatRouteGuardReviewPeerContemplatePrompt.ts # renders `verdict = unreadable — no numeric count found` + the why/what-to-do pair

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.review.unreadable._.choice.reason.md` — why `unreadable`, not `unparseable`/`invalid`/`empty`, and how it parts from `malfunction`
