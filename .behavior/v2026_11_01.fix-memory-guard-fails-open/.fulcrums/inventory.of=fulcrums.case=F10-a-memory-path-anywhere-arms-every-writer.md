# F10: a memory path anywhere arms every writer

## .the fork

a loop header, a `read`, a pipe into `xargs`, or a `D=` carries a memory path into a simple command that names none (`for f in M/*; do cp a "$f"; done`). track each carrier by its own grammar, or count a memory path named anywhere in the command as reached by every part of it?

## .taken: count it anywhere

- each carrier is a grammar of its own (`for … in`, `read`, `xargs`, `find -exec`, `$(…)`, process substitution); a carrier the guard lacks would pass a true write, the fail-open shape this route exists to close
- the whole-command rule over-approximates: a gap in the text blocks rather than passes
- the cwd fold follows the same law: it keeps every cwd the command may hold (`||`, a subshell, an `if`), never only the last

## .the cost

a read beside an unrelated cp or mv now blocks: `mv a.md b.md && cat M` (the read route is two calls). `tee` is spared: it writes only its operands, so each is graded as a redirect target is, and `cat M | tee .agent/…/b.md` passes; a tee whose operands the text cannot read (`xargs tee`, `tee {}`, `tee $F`) stays blunt.

and a relative redirect beside a memory read blocks when the payload carries no `cwd` (the harness always sends one).

## .rework: clean

the carry lives in one leaf, `getAllBashSegmentScenes`; a narrower rule swaps `memoryInCommand` for a per-carrier bind.

## .confidence: 85%

sound by construction, and the friction is rare and names its own read route; the risk is a common read shape this blocks that the verdict table lacks.

## .where

`src/domain.operations/memory/getAllBashSegmentScenes.ts`.

## .verdict

open for the human.
