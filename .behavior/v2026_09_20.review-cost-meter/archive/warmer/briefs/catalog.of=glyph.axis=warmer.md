# catalog.of=glyph.axis=warmer

## .what

the glyphs that mark **what a verdict on the cache warmer can honestly claim.** each opens the
verdict row at `--of tree|grove` and the lane row at `--of tree`, so one glyph carries one verdict
at both widths.

declared in `src/domain.operations/review/asWarmerValueLines.ts` (`GLYPH_OF_WARMER_VERDICT`), from
the verdicts `getOneWarmerValue.ts` derives (`WarmerValueVerdict`).

## .the members

| glyph | verdict | what settles it |
|---|---|---|
| 🌙 | `unproven` | a priced review after a warmed run — none has settled yet |
| ⛔ | `loss` | already settled. the settled pairs cost more than the most the cache could have saved |
| 🟡 | `maybe` | a `--warmer off` control lane. the net is at or above zero, against an upper bound |

## 🟡 .⛔ is final because the net weighs SETTLED pairs alone

a warmed run whose follower has not yet landed is never in the net — neither its poke cost nor
its amount saved. so a negative net cannot be lifted by a review still to come, and ⛔ claims no
certainty the figures do not hold.

⇒ the runs still in reach render on their own `awaited:` row, as a count, with **no glyph**. it
is a settle state of one warmed run (`WarmerPairSettle`), never a verdict position, so it claims
no slot on this axis.

## 🟡 .🌙 is one concept with the `halt` axis's 🌙

`halt`'s 🌙 is a review that never ran; this 🌙 is a warmer with no review to weigh. both say
*"naught was measured here, and that is reported, never zeroed"* — one concept seen twice.

## .see also

- `catalog.of=glyph._.md` — the index across every axis
- `catalog.of=glyph.axis=halt.md` — the other 🌙
