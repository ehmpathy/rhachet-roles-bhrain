---
case: F3
rework: clean
ground: wrong
confidence: 0.85
status: held
owed: none
holds: []
lean: the halt reads every open dispute on the route, not only the stone's own
verdict: null
---

# F3 — the approval halt reads every open human-owed fulcrum on the route

## .the fork

- A: the halt at a gate lists every `owed: human, verdict: null` fulcrum on the route
- B: only fulcrums whose held concerns were raised on this stone

## .taken, why

A. an `owed: human` debt raised on an ungated stone rides to the next gate on the route. B would
leave such a dispute with no gate that ever shows it.

## .rework, why

clean. a filter on one read.

## .confidence, why low

a long route could pile many old disputes onto one late gate. the wisher may prefer a cap, or lines
grouped by stone. 85%.

## .where

`case=4` · `1.vision.yield.md`.
