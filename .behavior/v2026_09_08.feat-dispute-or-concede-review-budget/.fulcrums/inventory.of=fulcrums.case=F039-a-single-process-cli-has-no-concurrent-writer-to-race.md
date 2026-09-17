# F039 — a single-process CLI invocation has no concurrent writer to race

## the fork stated fairly

`arch-hazards-behavior` (r007, i006) raised three points that each name a hazard from a
CONCURRENT write between two reads within one `route.stone.set` call:

- **blocker.2** — `setStoneAsAbsorbed` computes `concernsLeft`/`concernsElsewhere` from the
  `absorptions` read at the top of the call, patched with `also: [about]` for the row this
  call is about to write. the point: a concurrent write between that read and the ack's
  render could make the ack's "still owed" count disagree with a fresh read.
- **blocker.3** — a stance re-declared against a FRESH given (the lane spoke again) appends a
  second row for the same `(reviewer, about)` pair, at a different `given`. the point: the
  ledger then holds two disputed rows for the same reviewer+concern across two givens, a risk
  it names as a double-count until a round runs.
- **nitpick.2** — the budget meter is read AFTER the passage write, so a concurrent write
  between the two could leave the ack showing a stale meter.

each names a true property of the code as it stands — the reads are not re-checked after the
write, and the ledger is append-only. the question is whether that property is a defect.

## the argument taken, and why

**disputed**, all three.

blocker.3's premise fails against the actual selector. `getLiveReviewAbsorptions` filters
absorptions to ONLY the row whose `given` matches the slug's **latest** given
(`getLatestPeerGivensPerSlug`). the moment a lane's given moves, every prior row for that slug
no longer matches `pathGivenLatestBySlug.get(stance.reviewer)` and drops out of every
live-corpus fold — the judge's tally, the dispute-skip, the concession-exhaustion kind, all of
which route through `getLiveReviewAbsorptions`. so the double count the point names cannot
arise: the old row and the new row are never BOTH live at once, by construction, not by
promise. the ledger holding two historical rows is the append-only design at work as intended
(S03's per-generation lapse), not two counted votes.

blocker.2 and nitpick.2 both name one shape: an informational render (the ack's "still owed"
count, the ack's meter line) computed from a read taken before a write this same call is
about to make, or before a write another process theoretically lands between two reads inside
one `await` chain. two facts bound the harm:

1. **the render is informational, never a passage decision.** the judge and every gate that
   actually holds or releases a stone reads the ledger FRESH, at ITS OWN call — no gate trusts
   the ack's printed count. a stale ack line costs the driver a re-read, never a wrong pass.
2. **`route.stone.set` is one sequential CLI invocation.** every read/write pair inside it is
   `await`ed in order, with no other writer inside the process between them. the concurrent
   writer these points posit is a SEPARATE process (a second clone on the same route) that
   lands its own write in the exact window between this call's read and its render — a real
   possibility in this repo's actual multi-clone usage, but one that resolves itself on the
   very next read (the ledger is append-only, so no write is lost — only a display line runs a
   moment behind).

so the harm test (`rule.forbid.overzealous-blockers`) finds no nameable shipped harm: no
driver is misled about whether they may proceed (the judge stays authoritative and fresh), and
a stale informational count self-corrects on the next command.

## rework, and why

**clean.** to dispute these three points asks for no code change — the code already does what
it was designed to do, and the blocker.3 rebuttal is checked directly against the selector it
describes. to reverse this fulcrum would mean a fresh read-after-write in
`setStoneAsAbsorbed`'s ack path (blocker.2/nitpick.2) — a small, local, additive change with no
downstream ripple.

## confidence

85% — the blocker.3 rebuttal is a direct read of `getLiveReviewAbsorptions`'s filter, not an
inference. the blocker.2/nitpick.2 rebuttal rests on the judge as the sole passage authority,
which `rule.require.judge-derived-counts` and every gate in this diff already establish.

## where

- `src/domain.operations/route/stones/setStoneAsAbsorbed.ts` (blocker.2, nitpick.2)
- `src/domain.operations/route/guard/review/peer/getLiveReviewAbsorptions.ts` (the selector
  blocker.3's premise is checked against)

## verdict

open — council to rule at the close.
