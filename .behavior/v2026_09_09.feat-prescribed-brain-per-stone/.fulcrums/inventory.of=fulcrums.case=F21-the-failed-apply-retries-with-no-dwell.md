# F21 — a failed brain apply retries every tick, with no dwell

**rework** = 🔴 dirty · **status** = open · **confidence** = 75%

## .the fork

a stone parked on a repairable cause (`unenrolled`, `timed-out`) re-runs the apply every onStop tick
— a `clone whoami` spawn under `WHOAMI_TIMEOUT_MS`, plus a fresh `clone say` — for as long as a human
works that stone (`brain/applyStoneBrainOnEntry.ts`).

| option | buys | costs |
|---|---|---|
| **retry every tick** — taken | the self-heal is immediate: `rhx enroll`, and the next tick applies | up to ~40% of the hook budget per tick, indefinitely |
| dwell — skip if the last attempt was seconds ago | the same self-heal, one tick later at worst | a timestamp on `DriveBlockerState` and its snapshot |
| breaker — stop after N | cheapest | 🔴 rejected: a repairable halt becomes permanent, and the human who fixes the cause gets no signal a second act is owed |

## .taken, and why

**retry every tick.** a failed dispatch does not mark the entry, so the next tick re-attempts — the
direct read of *"fail loud, never a silent no-op"*, with one human act to repair.

## .rework — dirty

a timestamp on a persisted record this feature did not open, plus a resnap. see the root's
`DriveBlockerState` section: `F21`, `F22`, `F23` land in one contract change.

## .the counter-case

a dwell may be wrong, not merely deferred: it opens a window where a repaired environment is knowably
not applied, and a human who ran `rhx enroll` and saw no switch cannot tell a dwell from a defect.

## .where

`.dream/v2026_09_15.fix.stone-brain-undispatched-overload-and-retry-backoff.md` — the dwell's shape.

## .the verdict

open.
