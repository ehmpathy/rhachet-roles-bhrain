---
case: F1
rework: clean
ground: wrong
confidence: 0.75
status: ruled
owed: none
holds: []
lean: confidence lives in the fulcrum frontmatter, no --confidence flag
verdict: null
---

# F1 — the dispute's confidence lives in its fulcrum, not in a flag

## .the fork

the wish places `confidence` in the fulcrum frontmatter, and also shapes invariant 3's enforcer as
`--as disputed --confidence >= 0.90`. taken literally, the number is typed twice: once in the file,
once on the command.

- A: `--as disputed` reads `confidence` from the frontmatter of the `--why` fulcrum. no flag
- B: `--confidence` is a required flag; the frontmatter mirrors it
- C: both; refuse when they disagree

## .taken, why

A. invariant 5 says the fulcrum file is the one home of a deferral and its attributes are never
typed twice. B breaks that law to serve invariant 3; A serves both. the `--why` path is already
required, so the read costs the driver no new input.

## .rework, why

clean. a flag added later (C) is additive and touches one parser.

## .confidence, why low

the wish names the flag explicitly; the wisher may want the number visible in the command line for
audit. 75%.

## .where

`1.vision.yield.md` · `case=3`.

## .verdict

upheld by the wisher at the `1.vision` approval, 2026-11-16 (seed S01): `confidence` lives only in the
fulcrum frontmatter; no `--confidence` flag. `--as disputed` reads it from the `--why` fulcrum.
