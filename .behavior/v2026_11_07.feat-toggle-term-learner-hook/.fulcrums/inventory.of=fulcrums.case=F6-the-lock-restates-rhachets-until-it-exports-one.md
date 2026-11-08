# F6 — the lock restates rhachet's until rhachet exports one

## .the fork

- **A.** take rhachet's own mutex key in rhachet's cache dir, by its rule restated here, clamped from outside
- **B.** a lock of the toggle's own
- **C.** no lock; wait for rhachet to export `withRepoMutex`

## .taken — A

the toggle is a read-modify-write of a file rhachet rewrites whole (the hook sync, the enroll
derive). B keeps two toggles apart and still lets a concurrent `rhx init` write from a stale read
and drop the entry. C ships that same race until an upstream release. A is the one shape that
holds today: same dir, same key rule, same package pins, so both sides take turns.

the reach-in is real, and named: rhachet does not export the lock. the remedy is at the source —
dream `v2026_11_07.reseed.rhachet-export-with-repo-mutex` — and `case10` holds rhachet's own key
from outside and asserts the toggle waits, so a split of the two locks turns the suite red.

## .rework — clean

once rhachet exports `withRepoMutex`, `withTermsHookSettingsHold` becomes one call to it; no
caller changes.

## .confidence — 85%, why not higher

the key rule and pins were read in rhachet 1.51 source and clamped by `case10`; a later rhachet
could move the dir without a major bump.

## .where

`withTermsHookSettingsHold.ts` · `5.1.execution.from_vision.yield.md` (Q8)
