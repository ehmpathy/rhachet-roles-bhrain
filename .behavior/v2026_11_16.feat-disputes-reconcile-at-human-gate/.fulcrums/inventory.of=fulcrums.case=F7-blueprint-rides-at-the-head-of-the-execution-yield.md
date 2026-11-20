---
case: F7
rework: clean
ground: wrong
confidence: 0.70
status: ruled
owed: none
holds: []
lean: the blueprint is the head of the 5.1 yield; the commander reads it there
verdict: null
---

# F7 — the blueprint rides at the head of the execution yield

## .the fork

at the `1.vision` approval the director said the blueprint goes to the commander for review. this
route has no blueprint stone: `1.vision` → `5.1.execution.from_vision` → `5.3.verification`. a
question on how to proceed was declined, with "continue".

- A: drive the route as declared. the blueprint is the first section of the 5.1 yield; the commander
  reviews it there and at `5.3.verification`
- B: add a `3.blueprint` stone with an `approved?` gate (needs a route mutation grant)
- C: write the blueprint, then halt `--as blocked` before any code

## .taken, why

A. "continue" after the question reads as "drive the route you have". A needs no grant, and halts
no one.

## .rework, why

clean. the blueprint is written either way; B or C only moves where it halts.

## .confidence, why low

the director named a blueprint review explicitly, and A lets code land before the commander reads
the blueprint. 70%.

## .where

`5.1.execution.from_vision.yield.md`.

## .verdict

ruled by the director, 2026-11-17 (seed S02): this tree is nano — no size grant on file — so no
blueprint stone is owed and the route stays as declared. 5.1 executes from the vision; the commander
reviews the code at the PR, not a blueprint. so A's route holds, but its "blueprint at the head of
the yield" half is moot: no blueprint is owed. outcome owed: PR green by 2026-11-17 [time]Z.
