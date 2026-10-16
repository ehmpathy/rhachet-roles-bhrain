# F275 — the spinner close owns the gap above metrics.realized

- raised 2026-10-12, by `ergo-snapshot-visual-blemishes` (nitpick.8), at 5.3 i004
- rework: **clean** — a blank line in one emitter, or a tail in the spinner close
- status: 🟡 **BEST-GUESSED — disputed; the gap belongs to the spinner**
- confidence: **70%**

## .the fork, stated fairly

`stepReview.caseOutputLimitRunaway.integration.test.ts.snap` pins `✨ metrics.realized` flush under the
spinner line, where `🔭 metrics.expected` sits after a blank.

| option | the claim |
|---|---|
| **A — leave the realized emit as is** | in a terminal the spinner close prints `└─ elapsed: Ns ✓` and a blank, which parts the two. a blank added before the realized emit would print two blanks there |
| **B — print a blank before the realized emit** | the gap should be explicit, not incidental |

## .taken, and why

**A.** `genReviewOutputStdout` trims its own lead newline, and the separation is the spinner's job: the
spinner opened the block, so its close is what ends it. option B fixes the pinned capture at the cost
of a double gap on the surface a driver watches. the honest cure is a spinner that closes the same
way with or without a tty, which is a change to the shared spinner, not to this emit.

## .rework, and why

**clean.** either cure is a line or two.

## .confidence, and why it is not higher

a driver who pipes `rhx review` into a file meets the jammed shape, so the capture is a real surface.

## .where

`src/domain.operations/review/genReviewOutputStdout.ts`

## .verdict

— (awaits the council)
