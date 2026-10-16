# seed S45 — partitions are declared once per route, and every reviewer reuses them

archived verbatim, before distillation. typos repaired. a question that reshaped S44's
per-reviewer command: the split is a property of the code, so it is declared once.

## .said

> hey btw when we have a route.guard.partition, should that apply to all reviewers or just one by one? i guess i wonder if the partitions can be declared once and reused throughout the full route

> since the code either is or is not partitionable

> along the same boundaries
> that way, it doesn't have to be redeclared over and over and over
> know what i mean?

> yeah, it could be just --for review --peer @all

> and just make that standard so folks always know it applies to all

> and then it enables a non-all override too if they want a partition that only applies to a subroute

## .settled

- whether code splits cleanly is a fact about the code, never about the rubric that reads it. so
  one declaration serves every reviewer on every stone of a route
- the command keeps its name and shape: `rhx route.guard.partition --for review --peer @all`. the
  `@all` declaration is held once for the route — never copied onto each peer line — so a peer
  added later inherits it and no copy can drift
- each lane applies the route's partitions to its own targets: a partition that claims none of a
  lane's targets drops out of that lane; the unclaimed and route checks run per lane; the window
  check runs per lane, since each lane's head differs
- `--peer @all` is the STANDARD form — every brief, refusal, and lever shows it, so a reader always
  knows a partition applies to all
- a non-all declaration (`--peer <slug> --stone <s>`) is an OVERRIDE that layers on `@all` by
  slug: it replaces that slug for that one peer, and every other `@all` partition still applies

## .landed in

- (open) `rhx route.guard.partition`, the route-level declaration file, its read in `rhx review`
  when a route is bound, the briefs that cite the per-peer form
