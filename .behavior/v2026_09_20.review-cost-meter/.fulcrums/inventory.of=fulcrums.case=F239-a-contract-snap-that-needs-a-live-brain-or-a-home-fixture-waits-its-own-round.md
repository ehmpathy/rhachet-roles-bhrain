# F239 — a contract snap that needs a live brain or a home fixture waits its own round

- raised 2026-10-12, by `ergo-contract-snapshots` (blocker.1, blocker.7, blocker.8, nitpick.3, nitpick.10), at 5.3 i003
- rework: **clean** — each held case is a new test file or a new case; no prod contract moves
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **75%**

## .the fork, stated fairly

five concerns ask for a contract-grain snapshot this round could not mint for free:

| concern | the surface | what the snap needs |
|---|---|---|
| blocker.1 | `🦉 warmer: awake` · `already awake` · the disown block | a lane'd guard round that spawns a detached warmer, which pokes a live brain. `--mode plan` refuses a warmer (`reviewWarmerFlag [case7]`), so no zero-spend path exists |
| blocker.7 | `reflect.snapshot.get --at <valid>` · `reflect.savepoint.get --at <valid>` | a HOME-rooted reflect store seeded per run |
| blocker.8 | `reflect.snapshot.capture` success | a seeded claude transcript plus the HOME store |
| nitpick.10 | `rhx reflect` success | a live brain call |
| nitpick.3 | 26 partition transformers, one unit test each | a 25-suite sweep in one round |

| option | the claim |
|---|---|
| **A — hold, and pin below the contract grain** | every held render is pinned at unit or integration grain today (`F222` names each at its true grain). blocker.7 and blocker.8 renders are pre-extant and byte-identical; this branch changed only their refusals, which are snapped. nitpick.3's transformers run inside their callers' suites |
| **B — mint each snap now** | a contract-grain snapshot is what a reviewer reads; a render below that grain is not the journey a human meets |

## .taken, and why

**A.** each snap carries a cost no driver can pay alone: live brain spend per CI run, a detached
process with no owner, or a HOME fixture that must not touch the human's own store. nitpick.3 is
dirty by size, not by shape. the cheap halves landed this round: `F222` now names each warmer
render at its grain, and `asRouteGuardPartitionClaimsOfFlags` got its own test.

## .rework, and why

**clean.** each snap is additive: a new case or a new test file. no contract has to change to
admit it.

## .confidence, and why it is not higher

a strict reader holds that a contract render with no contract-grain snapshot is a gap regardless
of its cost, and that a HOME fixture is a known pattern (`genTempDirForReflector` seeds
`~/.claude/projects/` already).

## .where

`src/contract/cli/reviewWarmerFlag.acceptance.test.ts` ·
`blackbox/reflect.snapshot.capture.acceptance.test.ts` ·
`src/contract/cli/reflect.ts` (`printSnapshotOfAt`, `printSavepointOfAt`) ·
`src/domain.operations/review/partition/`

## .verdict

— (awaits the council)
