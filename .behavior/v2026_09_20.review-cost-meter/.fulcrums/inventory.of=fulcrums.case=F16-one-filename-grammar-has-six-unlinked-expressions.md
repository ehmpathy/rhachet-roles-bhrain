# F16 — one peer-review filename grammar, six unlinked expressions

| field | value |
|---|---|
| **case** | F16 |
| **title** | the peer-review filename grammar is expressed six times with no shared source |
| **rework** | 🔴 **dirty** |
| **status** | open — deferred, with the shape of the fix written down |
| **confidence** | 96% that the defect is real · 88% that the deferral is the right call |
| **raised by** | peer — `enroll-impl-arch-defects`, i016 r011, nitpick #2 `[urgent]` |
| **where** | `route/guard/review/runStoneGuardReviews.ts:202,206` (write) · `route/guard/review/peer/getRouteGuardReviewPeerPathMeta.ts:38,41` · `…/getRouteGuardReviewPeerPathTaken.ts:3-4` · `…/asPeerReviewSlugFromPath.ts` · `…/enumRouteGuardReviewPeerFiles.ts` · `review/meter/asReviewRunIdentity.ts:51` (read) |
| **dream** | `.dream/v2026_09_22.fix.six-expressions-of-one-peer-review-filename-grammar.md` |

## .the fork, stated fairly

**option A — unify now.** declare the grammar once in `route/guard/review/peer/`, have the
write side compose through it, and clamp the round trip through `asReviewRunIdentity`. the
harm the lane named closes completely: a rename becomes loud rather than silent.

**option B — defer, with the shape written down.** leave the six expressions apart for this
stone, catch the work with its fix specified, and raise this row so the deferral is a
reviewable call rather than an omission.

## .taken, and why at the time

**option B.** both halves of the SAFE/CLEAN test answer no:

- **not safe** — the write side (`runStoneGuardReviews`) names every peer review on disk, and
  expression #2 parses what it writes **and gates stone passage**. a defect there halts the
  entrance gate, the exit gate, and the stophook for every route in this repo. that is not a
  change to land at the close of an execution stone
- **not clean** — `runStoneGuardReviews.ts` is **not in this branch's change set at all**. the
  work ripples into `route/guard/review/peer/`, a bounded context this branch does not touch,
  across 5+ modules and ~40 test files that assert these names verbatim

## 🔴 .the correction this row carries — the lane's COUNT is low by ~3×, and its REMEDY collides

the lane described *"a second, unlinked expression."* a read finds **at least six**, five of
which predate this branch and live together in `route/guard/review/peer/`. so
`asReviewRunIdentity` is not the drift — it is the **sixth instance of a pre-extant drift**,
and it is the only one outside the context that owns the grammar.

and the lane's proposed remedy — *"a single parser pair imported by both sides"* — cannot be
built as written:

| | `getRouteGuardReviewPeerPathMeta` | `asReviewRunIdentity` |
|---|---|---|
| the **hash** | 🔴 matched, validated, and **deliberately discarded** | 🔴 **required** (`ReviewRunIdentity.hash`) |
| on a mismatch | **throws**, with a fix the driver can act on | **answers null**; the caller buckets it |

the hash refusal is a **settled argument** — `r8 blocker.1 (i002)`, `r11 blocker.1 (i003)`,
`r11 blocker.2 (i004)` of another behavior — because to pair a `.given` to its `.taken` by
`(slug, hash)` hands a fresh critique the prior iteration's answer. the two downstream data
objects refuse a `hash` field for exactly that reason.

⇒ one parser for both must either **re-open a settled argument** or **break the meter**. the
honest unit is a shared **composer** (one write source) with the readers left apart — which is
what the dream specifies.

⚠️ this is the **third** time this round a lane called a repair cheap that a read shows is not
(F12's one-line `try/catch`, F13's cheap drill-in hint, and now this). the concerns were
correct every time; the estimate of cost was not. the distance between those two facts is what
a `.taken` exists to state.

## .what makes the rework dirty

a rename of the grammar today breaks #2 **loudly** — it throws with a named fix. that loudness
is real protection the unification must not lose. a shared composer must be introduced without
a window in which #1 writes one shape and #2 expects another, which means the composer's output
must be proven byte-identical **before** #1 is switched to it.

## .the verdict, once ruled

`[unruled]` — reserved for the wisher, or for whoever next opens
`route/guard/review/peer/`. the row exists so the call is visible rather than inferred from an
absence.
