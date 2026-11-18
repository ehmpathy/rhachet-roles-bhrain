---
case: F2
rework: clean
ground: wrong
confidence: 0.60
status: ruled
owed: none
holds: []
lean: the verdict lever is rhx route.fulcrum.rule, human-only
verdict: null
---

# F2 — the human's verdict lever

## .the fork

the wish says the human rules on each dispute — uphold, or concede and send the driver to fix — but
names no command.

- A: a new human-only skill `rhx route.fulcrum.rule --case F44 --as upheld|conceded`
- B: new `--as` values on `route.stone.set` (e.g. `--as upheld --that F44`)
- C: the human edits `verdict:` in the frontmatter by hand

## .taken, why

A. the verdict is about a fulcrum, not a stone — a fulcrum can hold concerns across lanes and be
carried across stones (`case=4`). B overloads a stone verb, and `conceded` already means the
driver's concession there, so `--as conceded` by a human would read two ways. C cannot tell a human
edit from a driver edit, and invariant R13 forbids the driver to write `verdict`.

## .rework, why

clean. the lever is a thin writer over the frontmatter; a rename or a move into `route.stone.set`
touches one skill and the halt's render.

## .confidence, why low

the repo prefers few skills; the wisher may want it on `route.stone.set` beside `--as approved`. the
human-only check must reuse whatever guards `--as approved` today. 60%.

## .where

`case=2` · `1.vision.yield.md`.

## .verdict

upheld by the wisher at the `1.vision` approval, 2026-11-16 (seed S01): the human's verdict command
is `rhx route.fulcrum.rule`. the name of its `--as` values (`upheld | conceded` vs a non-overloaded
word for the human's concede, per `.what is awkward`) remains for the blueprint.
