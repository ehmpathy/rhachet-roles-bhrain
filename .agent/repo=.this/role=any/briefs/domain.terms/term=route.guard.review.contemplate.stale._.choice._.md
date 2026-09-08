# domain.term: stale

term.chosen   = stale
term.kind     = adj
term.boundary = route.guard.review.contemplate
term.synonyms.forbidden:
- outdated
- superseded
- expired
- old

## .what

one of the two tags an **uncontemplated** reviewer carries. `stale` means the driver **has**
written a `.taken` for this reviewer, and it answers a given the reviewer has since superseded.

⇒ **the reviewer has spoken again.** the answer on record is a reply to an older critique.

its peer on the same axis is `absent` — no `.taken` exists at all. the axis is closed at two:

| tag | a `.taken` exists? | what the driver must do |
|---|---|---|
| `absent` | ❌ no | write one |
| `stale` | ✅ yes | write a **new** one, against the latest given |

## .refs

- `src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeersUncontemplated.ts` — where the tag is computed
- `src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerContemplationStatus.ts:32` — `tag: 'absent' | 'stale'`
- `src/domain.operations/route/guard/tree/formatRouteGuardReviewPeerContemplatePrompt.ts:243-245` — the copy a driver reads

## .reason

- `term=route.guard.review.contemplate.stale._.choice.reason.md`
