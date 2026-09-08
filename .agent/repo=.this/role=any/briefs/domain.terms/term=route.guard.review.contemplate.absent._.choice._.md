# domain.term: absent

term.chosen   = absent
term.kind     = adj
term.boundary = route.guard.review.contemplate
term.synonyms.forbidden:
- unanswered
- empty
- none
- null

⚠️ the obvious fifth synonym is a **gerund** and is already forbidden repo-wide by
`rule.forbid.gerunds`, whose own alternatives table names `absent` as the replacement. it is
omitted from the list above rather than repeated, since a second forbid adds no force.

## .what

one of the two tags an **uncontemplated** reviewer carries. `absent` means **no `.taken` exists
at all** for this reviewer — the driver has not replied to its critique in any form.

its peer on the same axis is `stale` — a `.taken` exists, but it answers a given the reviewer
has since superseded. the axis is closed at two:

| tag | a `.taken` exists? | what the driver must do |
|---|---|---|
| `absent` | ❌ no | write one |
| `stale` | ✅ yes | write a **new** one, against the latest given |

⚠️ **the tag describes the FILE, never the reviewer's verdict.** a reviewer with an `absent` tag
has spoken; it is the driver who has not.

## .refs

- `src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeersUncontemplated.ts` — where the tag is computed
- `src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerContemplationStatus.ts:32` — `tag: 'absent' | 'stale'`
- `src/domain.operations/route/guard/tree/formatRouteGuardReviewPeerContemplatePrompt.ts` — the copy a driver reads

## .reason

- `term=route.guard.review.contemplate.absent._.choice.reason.md`
