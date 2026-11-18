# F11 — the pr waits on a human's commit quota

## .the fork

- **A.** pass the execution stone on its own deliverable; open the pr at the checkpoint, once a human grants quota
- **B.** hold the execution stone until the pr is open

## .taken — A

the wish's `pr open, ci green` is the route's delivery gate, and the director placed it at the
checkpoint after this stone (commit, push, pr open). the commit quota is a human-only lever:
`rhx git.commit.uses get` reports `no quota set`, and only a human may run
`rhx git.commit.uses set --quant N --push allow`. B would hold a finished stone on a lever the
driver may not pull.

## .rework — clean

the commit, push, and pr follow the grant, with no change to the work.

## .confidence — 95%, why not higher

the director may want the pr opened before this stone passes; that is a one-line ask.

## .where

`5.1.execution.from_vision.yield.md` (todos)
