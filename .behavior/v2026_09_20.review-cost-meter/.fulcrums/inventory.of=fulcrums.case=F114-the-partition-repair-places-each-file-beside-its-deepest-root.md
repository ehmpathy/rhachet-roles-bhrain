# F114 — the partition repair places each unclaimed file beside its deepest declared root

- raised 2026-10-06, by the driver, while the malpartitioned entrance gate was cured
- rework: **clean** — one transformer (`asRouteGuardPartitionRepair`) and its test
- status: 🟡 **BEST-GUESSED — dispute it**
- confidence: **75%**

## .the fork, stated fairly

the malpartitioned refusal prints a paste-ready repair command. it must say WHERE each
unclaimed file goes, and S42 holds that only the caller knows what is isolatable.

| option | the claim |
|---|---|
| **A — deepest root that contains the file, else `rest` (as shipped)** | the partition whose glob root already sits above the file is the subtree its author meant to cover; the file joins with its whole dir, so the next edit there needs no repair |
| **B — always a new `rest` partition** | never guesses a domain; but a `rest` bucket is a horizontal grab-bag (`rule.forbid.horizontal-partitions`) and strands the file from the domain it imports |
| **C — name the files, print no command** | honors S42 to the letter; leaves the driver to re-type the whole set by hand, which is the friction that bred the stale set |

## .taken, and why

**A.** it is a proposal printed per file (`path → slug (+ glob)`) beside the command, never an
auto-write: the driver reads it and runs it, so the caller still decides (S42). C was the
shipped shape and is the defect `rule.forbid.workarounds` names. B guesses no domain but
picks the one bucket the reviewer role forbids.

## .rework, and why

**clean.** one pure transformer and its unit test; the gate and the render take its output as-is.

## .confidence, and why it is not higher

"deepest root" is right for a new subdir beside its peers (the case that fired). it can be
wrong where a glob root is broad (`src/**` in `rest`) and a narrower domain would fit better —
then the proposal lands the file in the grab-bag. no measurement over other repos' sets backs it.

measured 2026-10-06, in the gap clamp's own fixture: a set that declares `route=src/route/stones/**`
sends a new `src/route/drive/b.ts` to `rest`, not `route` — a peer dir sits outside every root.
an option D (the partition whose root shares the longest path prefix) would place it in `route`; it
would also pull an unrelated peer domain into whichever partition sits nearest. held for the council.

## .where

`src/domain.operations/route/guard/partition/asRouteGuardPartitionRepair.ts`

## .verdict

— (awaits the council)
