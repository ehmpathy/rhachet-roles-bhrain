# seed S42 — partitions stay caller-declared, because only the caller knows what is isolatable

archived verbatim, before distillation. typos and profanity repaired. questions about ergonomics,
then a settlement that struck the driver's auto-split proposal and reaffirmed S33.

## .said

> also, how do users of this specify partitions? will it be intuitive for them?

> what's the ergonomics for the dynamic partition declaration that users run btw

> what command do they run

> oh [placeholder] auto split? autosplit sounds like it's not possible automatically though since we don't know the interdependencies? or are you saying we can compute the interdependencies via a codegraph?

> i.e., to ensure that each partition has all the relevant context

> i thought that was the point to start with --partitionable as a caller supplied argument exclusively, because otherwise we don't know which ones are isolatable vs not

## .settled

- 🔴 **`--partitionable` is caller-supplied, exclusively.** whether a subtree can be reviewed in
  isolation is a judgment about the code's cohesion that only its owner holds; a split the tool
  guesses can strand a file from the context it needs, and the review then grades a fragment
- a codegraph narrows the guess and never closes it — imports are not the whole of what a reviewer
  needs (a rubric, a peer contract, a doc). so auto-split is not built here; it is a future dream,
  and the declared flag stays the only way a review splits
- the ergonomic cure stays inside the declared form: the overflow refusal names the lever and a
  ready-to-paste `--partitionable` line, so the caller meets the flag at the moment it is owed

## .landed in

- S33 (the original settlement), unchanged
- `.dream/v2026_10_06.feat.review-autopartition-via-codegraph.md` — auto-partition, ruled future
  work rather than struck outright
