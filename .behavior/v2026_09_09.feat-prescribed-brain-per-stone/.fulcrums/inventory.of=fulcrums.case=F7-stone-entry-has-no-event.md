# F7 — stone entry has no event; `DriveBlockerState.stone` detects it

**rework** = clean · **status** = open · **confidence** = 85%

## .the fork

the wish says the hook applies the switch "on entry", and no stone-entry event exists. the driver
role wires `SessionStart`, `PreToolUse`, `Stop` (`getDriverRole.ts:25-70`).

| candidate | cost |
|---|---|
| `route.drive --when hook.onStop`, compare against the last stone seen | fires every turn; needs a memo of the prior stone |
| `PostToolUse` after `route.stone.set` | a new hook; passage can advance by other paths |
| `route.stone.set` dispatches directly | the issue assigns the apply to the driver hook, not the engine |
| `route.drive --when hook.onBoot` alone | misses every in-session advance |

## .taken, and why

**`route.drive` at `hook.onBoot` and `hook.onStop`, keyed by a stone change.**

the memo is already on disk:

```
stepRouteDrive.ts:295          → setDriveBlockerState({ route, stone: stone.name })
setDriveBlockerState.ts:25-31  → writes { count, stone } to $route/.route/.drive.blockers.latest.json
getDriveBlockerState.ts:22-25  → reads it; stone = null on a fresh state
```

⇒ `stateBefore.stone !== stone.name` is the entry edge — no new persistence, no live-brain read, so
no dependency on `F5`. the applier converges rather than compares (`F14`).

## .the counter-case

`hook.onStop` is the repo's most load-heavy hook, and a socket dispatch adds work there. this half stands.

## .rework

clean — the detector is internal; no guard field or user-faced contract depends on it.

## .confidence — 85%

the residual was whether the hook timeout admits a dispatch. measured 2026-09-25: `clone whoami`
p50 = 5537ms, so both `route.drive` sites were raised to `timeout: 25`. a 10s probe cap plus a 15s
verify is exactly 25s — so the dispatch must be detached, which `case=5` requires anyway to avoid a
deadlock. one mechanism satisfies both.

🟡 the 21-block cutoff accumulates across stones, since `count` never resets on a stone change —
caught as a dream, not this feature's to fix.

## .where

`1.vision.experience.case=1.the-stone-switches-my-brain.md` — `[t0]` · `case=6` — `[t0]`

## .the verdict

open.

⇒ the full entry, with the r3 correction: `../appendix/.fulcrums/inventory.of=fulcrums.case=F7-stone-entry-has-no-event.md`
