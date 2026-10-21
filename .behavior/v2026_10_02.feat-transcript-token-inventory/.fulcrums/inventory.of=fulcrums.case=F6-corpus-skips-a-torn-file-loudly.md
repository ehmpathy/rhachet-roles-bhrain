# F6 — in a corpus, a torn transcript is skipped and named, not fatal

## .the fork

a `glob · many` corpus run meets one file with a malformed line before its end. two choices:

- **A — abort the corpus** (exit 1), as a single-file run does (case=7)
- **B — skip that file, name it**, report the rest: the header carries `skipped (malformed) = N`
  with each path + line beneath it; exit 0 unless every file is malformed (then exit 1, cell 23)

## .taken — B, and why at the time

- a corpus run exists to read a distribution; a 212-file audit voided by one torn copy (a common
  artifact of a crashed laptop or an interrupted sync) is a tool that fails the question it was asked
- B is still loud: the skip is counted and named in the header, the shares are stated to be over
  the files read — the same pattern the corpus already uses for unmetered files (case=2)
- the single-file grain keeps A, because there the gap is inside the one report the human asked for

## .rework — clean

one branch in the corpus fold: catch the per-file `MalfunctionError` and count it, or let it
propagate. no caller depends on either; the render row is additive.

## .confidence — 75%, and why it is low

`rule.forbid.failhide` reads strictly on any caught error. B catches one, deliberately, and
surfaces it — which the rule's allowlist pattern permits, but the wisher may prefer the stricter A,
or a flag (`--strict`) to choose. raised by the dimensional-decomposition reviewer, who named the
corpus-abort behaviour as undecided.

## .where

- `1.vision.experience.dimensions.md` — walk 5
- `1.vision.experience.case=_.md` — cells 22, 23
- `1.vision.experience.case=2.audit-a-corpus.md` — `[case2b]`
- `1.vision.yield.md` — the edgecases table

## .verdict

open.
