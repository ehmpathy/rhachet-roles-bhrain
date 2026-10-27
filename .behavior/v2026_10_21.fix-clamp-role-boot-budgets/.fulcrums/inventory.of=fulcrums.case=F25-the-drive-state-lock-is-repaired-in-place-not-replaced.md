# F25 — the drive-state lock is repaired in place, not replaced

## .the fork

`withDriveStateLock` is a hand-rolled lock (`rule.forbid.hand-rolled-locks`), and its queue
deadline turned the full suite red. the repair can restart the deadline at each handoff inside the
lock as it stands, or replace the lock with `withSimpleMutex`.

## .taken, and why

repair in place. the red came from one deadline shared by the whole queue; a deadline per hold
cures it in one function, with a clamp (`mutateDriveBlockerState [case8]`) red before and green
after. the replacement changes the claim, the crash rule, and two error renders across every writer
of the drive state, which is a contract change in a pr about role boot budgets.

## .rework

dirty. the replacement touches every drive-state writer and retires the pid reap with its two
clamps. it is caught as a dream: `.dream/v2026_10_23.fix.drive-state-lock-onto-with-simple-mutex.md`.

## .confidence

80%. the rule is clear that the lock should not exist; the call is only which pr pays for it.

## .status

open — for the council.
