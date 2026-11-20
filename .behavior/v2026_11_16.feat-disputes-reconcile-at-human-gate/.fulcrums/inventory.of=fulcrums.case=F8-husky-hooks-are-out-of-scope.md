---
case: F8
rework: clean
ground: dirty
confidence: 0.85
status: open
owed: human
holds: [arch-hazards-maintenance/i001/blocker.8, arch-hazards-maintenance/i001/nitpick.1, arch-hazards-maintenance/i001/nitpick.4, ergo-friction-hazards/i001/nitpick.2, ergo-friction-hazards/i001/nitpick.3, mech-failhides/i002/nitpick.3, mech-failhides/i003/nitpick.1, ergo-friction-hazards/i003/nitpick.1]
lean: leave the .husky hooks to the change that authored them; this route ships the dispute gate only
verdict: null
---

# F8 — the .husky hooks are out of this route's scope

## .the fork

the i001 diff swept in `.husky/check.secrets.sh`, `.husky/check.timestamps.sh`, and
`.husky/check.timestamps.lock.sh`. they sit in the work tree as a declapract upgrade, not as this
route's work. five concerns grade them: a grep pipeline that fails open, unchecked git calls, a `|`
delimiter inside regexes, a misdiagnosed absent hook, and no clamp on either hook.

- A: leave the hooks alone; the change that brought them answers for them
- B: repair all five here, in a route about dispute gates

## .taken, why

A. the wish names six dispute invariants and the verdict lever; no line of it reaches a commit hook.
a repair here would ship unreviewed hook behavior under a dispute-gate title, and the hooks will be
re-stamped by the next declapract upgrade, which would undo a local repair. the concerns are real,
so each is caught as upstream work, never dropped.

## .rework, why

clean. the hooks are separate files; a later repair touches none of this route's code.

## .confidence, why low

the concerns are correct on their merits, and a reviewer can fairly say a diff owns what it carries.
the call is a scope call, which is the human's. 85%.

## .where

`.husky/check.secrets.sh` · `.husky/check.timestamps.sh` · `.husky/check.timestamps.lock.sh`.

## .verdict

open. owed to the human at the PR.
