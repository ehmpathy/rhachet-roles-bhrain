# seed S46 — a partition declaration replaces the whole set, so coverage fails fast

archived verbatim, before distillation. typos repaired. it amends S45: the per-slug `--set` /
`--del` verbs go, and every declaration states the full set at once.

## .said

> i kinda like the upfront single --partitions declaration that we had for the review skill on its own - that way we can failfast if any parts are not covered by a partition

> what do you think? then we can get rid of the --del/--set

> its always going to overwrite all the partitions for either @all or a given reviewer

> know what i mean?

## .settled

- a partition declaration always names the WHOLE set for its scope, and replaces whatever stood
  before. there is no per-slug upsert and no per-slug delete
- so coverage is checked against the full set at declaration time: a target in no partition, or a
  partition that lacks the bound route, refuses before the declaration is written — never a
  half-edited set that a later round trips over
- the scope is `@all` (the standard) or one peer. a peer's declaration replaces the `@all` set for
  that peer whole — it does not layer on by slug (this supersedes S45's layer clause)
- the guard command and `rhx review` take the same partition flags, so one form is learned once

## .landed in

- (open) `rhx route.guard.partition`, the briefs that cite `--set` / `--del`
