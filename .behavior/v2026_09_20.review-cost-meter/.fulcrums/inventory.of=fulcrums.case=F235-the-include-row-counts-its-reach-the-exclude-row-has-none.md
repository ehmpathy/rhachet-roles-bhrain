# F235 — the include row counts its reach, the exclude row has none

- raised 2026-10-12, by `ergo-snapshot-visual-blemishes` (nitpick.6), at 5.3 i003
- rework: **clean** — a new count on the scope record, and one more child row
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **80%**

## .the fork, stated fairly

in the scope block, `paths.with` carries a `files:` child and `paths.wout` carries none.

| option | the claim |
|---|---|
| **A — leave the exclude row bare** | `asReviewScopePathLines.ts:35-40` renders the `files:` child from the count of files the include globs matched before the join. an exclude glob has no reach of its own; it subtracts from that set, and no exclude count is measured anywhere |
| **B — add a count under `paths.wout`** | a reader sees both rows carry a child, and the shapes match |

## .taken, and why

**A.** the asymmetry reports a real asymmetry in what is measured. option B is a new measure on the
scope record, not a render fix, and a zero or a guessed count there would state a figure the run never
took.

## .rework, and why

**clean.** where a later round records how many files the excludes removed, the render adds one child
row and one resnap.

## .confidence, and why it is not higher

a reader may want the excluded count for diagnosis, and that want is real, even though no render can
supply it today.

## .where

`src/domain.operations/review/asReviewScopePathLines.ts:35-40`

## .verdict

— (awaits the council)
