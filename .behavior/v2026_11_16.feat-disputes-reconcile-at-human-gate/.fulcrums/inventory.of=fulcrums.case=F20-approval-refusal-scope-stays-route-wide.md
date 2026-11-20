---
case: F20
rework: clean
ground: wrong
confidence: 0.70
status: open
owed: none
holds: []
lean: the human's `--as approved` and `--as forced` stay refused on any stone while a dispute owes the human, gated or not
verdict: null
---

# F20 — the approval refusal's scope stays route-wide

## .the fork

r011 i011 nitpick.2: `isStoneApprovalInForce` exempts a stone with no human gate, but
`assertRouteFulcrumDisputesRuled` refuses a human `--as approved` or `--as forced` on any stone.
on an exhausted ungated stone, an unrelated open dispute then refuses the human's approval, which
is the exhausted-reviewer bypass. vision R53/R54 says a dispute neither grants nor blocks the
human's levers.

- A: keep the refusal route-wide, as invariant 2 states it: an approval is refused while any
  dispute owes the human, so a human never approves past a dispute unseen
- B: scope the refusal to stones with a human gate, so an ungated stone's bypass approval goes
  through while a dispute elsewhere waits

## .taken, why

A. invariant 2's text refuses approval while any dispute owes the human, and the refusal lists
every open dispute (F3), so the human who meets it can rule and then approve in one visit. the
cost is one verdict ahead of a bypass approval; the gain is that no approval lands while a
dispute sits unread. the reviewer graded it plausible, not proven, and asked for intent.

## .rework, why clean

one predicate in `setStoneAsApproved.ts` and `setStoneAsForced.ts` (call
`assertRouteFulcrumDisputesRuled` only where `isStoneGatedByHuman`), one case in each test. no
caller depends on the route-wide scope.

## .confidence, why 0.70

R53/R54 and invariant 2 read differently at an ungated stone, and the wish does not settle which
wins there.

## .where

`src/domain.operations/route/stones/setStoneAsApproved.ts` ·
`src/domain.operations/route/stones/setStoneAsForced.ts` ·
`src/domain.operations/route/fulcrum/assertRouteFulcrumDisputesRuled.ts`.

## .verdict

open. a design call for the human at the gate; owes no dispute.
