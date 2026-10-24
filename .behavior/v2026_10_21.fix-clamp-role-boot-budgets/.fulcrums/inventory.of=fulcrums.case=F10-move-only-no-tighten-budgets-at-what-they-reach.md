# F10 — move the argument out; do not tighten cue lines; set each budget at what it reaches

## the fork

- **A** — the vision's two moves: move the argument out, then tighten the cue lines that stay
  (a shorter row, a trimmed cell) until learner and driver reach 12k
- **B** — move the argument out, keep every cue line byte for byte, and set each budget at what
  the role reaches (case=5), with the reason in a boot.yml comment

## taken: B, and why

a tightened row is a cue line that changed. the census diff and the cue snapshot then see it as
a removal plus an addition, and each one needs a reflow record that a reviewer must read and
trust. across ~60 mins that list is long, and a real cut hides in it. with B the census diff
holds only orphan headers, so a dropped cue is plain to see. the wish allows this outright:
"if a role cannot reach its budget with every cue intact, set the budget at what it reaches".

## rework: clean

a tighten pass is a later pr over the same mins, with the snapshot as its guard. the budget
then drops to what that pass reaches. no work here builds on the higher figure.

## confidence: 75%, and why it is not higher

the director asked for 12k. B lands above it for learner and driver, and the tighten pass that
closes the gap is deferred rather than skipped.

## where

`src/domain.roles/{learner,driver,librarian}/boot.yml` (the budget comments).
