# F73 — a findings snapshot masks the live tally

- rework = **clean** — one `maskCounts` flag per case in `review.by.guard-peer.acceptance.test.ts`
- confidence = 🟡 **70%**
- raised.by = self, at i033 (r011 ergo-friction-hazards blocker.2)

## .the fork

`review.by.guard-peer.acceptance` snapshots a guard tree whose peer is a live brain. the findings
cases mask the concern counts to `[N]`; the pass cases keep `0 blockers` real.

| option | what the snapshot pins | cost |
|---|---|---|
| A — real counts everywhere | the exact tally the brain returned | a modal shift (1 → 2 blockers) on a live brain fails CI with no defect |
| **B — mask on findings, real on pass** | the verdict word, `threshold ([N] > 0)`, `passage = blocked`, exit 2 | the exact tally is not in the diff |

## .taken — B

- a findings case's contract is *"≥1 blocker ⇒ the guard blocks"*; the exact tally is the brain's,
  never the guard's. the count-agnostic floor is asserted beside the snapshot (`/\d+\s*blockers?/`)
- a pass case's `0 blockers` IS its contract, so it is never masked — the mask is per case, not
  suite-wide, and the test's header documents the split
- the peer suite the reviewer cites (`review.by.acceptance`) snapshots a direct `rhx review`, never
  a guard round: its stability across three attempts is one measurement, and the guard path adds
  the tally as a second brain-shaped figure

## .the part conceded

the glyph after a masked count (`🟠` vs `✓`) leaked the variance the mask hides. the mask now
covers the glyph beside a masked count too, so a masked line carries no live figure at all.

## .verdict

🟡 BEST-GUESSED 2026-10-01 — keep the per-case mask, extend it to the glyph; dispute the rest.
