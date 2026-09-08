# domain.term: route.guard.review.peer

term.chosen   = peer
term.kind     = noun
term.boundary = route.guard.review
term.synonyms.forbidden:
- lane
- channel
- slot

## .what
a **peer** is one configured reviewer on a guarded stone: a `slug`, the `run` that invokes it, the
`budget` of rounds it may spend, and the `level` it sits at on the ladder. it is the unit the guard
schedules, meters, and tallies.

⇒ it is the **party** that reviews, and the **configuration** that summons it, as one entity — the
declared type `RouteStoneGuardReviewPeer` holds both, so they are one concept rather than two.

## ⚠️ .peer is not rubric, and not rung

three words sit close on this surface and each names a distinct concept:

| term | what it is |
|---|---|
| **peer** | the reviewer entry — who reviews, how it is invoked, what it may spend |
| **rubric** | the rules a peer grades against — its `--rules` glob |
| **rung** / **level** | where the peer sits on the gate ladder, and that position's coordinate |

⇒ two peers may share one rubric at different scopes (`mech-test-intent` and
`mech-test-intent-asserts`), so a rubric is not a peer. and several peers share one level, so a level
is not a peer.

## .refs
where the term composes declared objects and operations:
- src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeerGivens.ts
- src/domain.operations/route/guard/review/peer/getLatestPeerGivensPerSlug.ts
- src/domain.operations/route/guard/review/peer/getStoneGuardReviewPeerUncontemplatedUnforgiven.ts
- src/domain.operations/route/guard/review/peer/asPeerReviewLevelBySlug.ts
- src/domain.operations/route/guard/review/peer/meter/getAllReviewPeerMeterStatuses.ts
- src/contract/cli/route.ts — the `--peer <slug>` flag on `route.guard.budget`
- the `peer:` key every `*.guard` file declares

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.review.peer._.choice.reason.md` — the etymology, why `lane` is forbidden in a
  contract though it is the natural prose word, and the 2026-09-07 evidence that surfaced the gap
