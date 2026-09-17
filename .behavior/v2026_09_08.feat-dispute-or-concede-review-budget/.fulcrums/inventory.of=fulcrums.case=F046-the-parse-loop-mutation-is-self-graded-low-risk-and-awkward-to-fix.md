# F046 — the parse-loop mutation nitpick is self-graded low-risk, awkward to fix cleanly

## the fork

arch-hazards-maintenance (r006, i006) nitpick.1: `parseReviewArgs`'s loop mutates a local
`options` record and `unknownFlags` array in place, the mutable-accumulator-in-a-loop shape
`rule.forbid.maintenance-hazards` grades.

## taken

dispute. the review's own text: *"it is genuinely low-risk — the whole purpose of the function
is to assemble a config record, the mutation never escapes, and the loop must read a value at a
time ... A fully immutable form is awkward for a CLI parser (each flag's value type differs and
the key is dynamic)."*

## why disputable

the reviewer names the facts that bound the risk itself (local scope, no escape, the domain
genuinely resists an immutable form) and grades it a nitpick on that basis. `better`, the
maintenance floor, is met by an unforced cosmetic style debt an author already grades awkward to
fix cleanly.

## rework

clean.

## confidence

70% — reasonable, and the council may prefer the fix be attempted regardless.
