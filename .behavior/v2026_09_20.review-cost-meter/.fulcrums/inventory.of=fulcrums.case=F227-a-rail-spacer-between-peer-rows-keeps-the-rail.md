# F227 — a rail spacer between peer rows keeps the rail

## .the fork

5.3 i002 r006 `ergo-snapshot-visual-blemishes` raised two nitpicks on one shape:

- `nitpick.1` — the by-input census in `genReviewMeterStdout` puts a `│  │` line between the section
  rows and the totals, and again before the `└─ locus` leaf
- `nitpick.2` — `genReviewRunStdout` emits `   │` after the locus block, before the run's last child

both cite the grove repair as precedent: a blank row between the token rows and `cost:` detached the
`└─` leaf from the rail it ends.

two answers: **(a)** concede, and drop every spacer · **(b)** dispute: a spacer that carries the rail
is a paragraph break, not a detach

## .taken

**(b)**. the grove repair removed a **bare blank** row — no `│` glyph, so the rail visibly broke and
the `└─` hung from naught. each spacer here **is** a rail segment: `│` sits in the rail's column, so
the line from the first `├─` to the final `└─` is unbroken. it groups the rows into paragraphs —
sections, then totals, then locus — the same convention the run's lever and token sections already
use, which the lane itself names.

## .rework

**clean.** if the council reads the spacers as noise, drop them: one line each in two renderers, then
a resnap.

## .confidence

🟡 **88%** — the difference between a bare blank and a `│` spacer is visible in every snapshot the
lane cites; the residual doubt is taste, which the council may rule either way.

## .where

`src/domain.operations/review/meter/genReviewMeterStdout.ts` ·
`src/domain.operations/review/meter/genReviewRunStdout.ts` ·
`src/domain.operations/review/grove/genReviewGroveStdout.ts` (the precedent)

## .verdict

unruled — awaits the council.
