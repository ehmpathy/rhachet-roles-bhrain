# F14 — the route-complete line keeps its shape

- **the fork:** ergo-snapshot-visual-blemishes (5.3 i001 r006, nitpick.3) asks that
  `🗿 route complete 🌴🤙` match the stone-line pattern `🗿 <stone>, <phase> <glyph>`, or be
  documented as an exception. (a) reshape it; (b) keep it, and cite where it is already declared
- **taken:** (b). the line is not new to this branch: origin/main ships it, the vibe-axis glyph
  catalog (`domain.glyphs/catalog.of=glyph.axis=vibe.md`) declares `🌴🤙` for it, and the
  `v2026_07_22.fix-route-statusline` vision set its `{ kind:'complete' }` render. this wish's done
  bar is that the line shows the same stone and status the old one showed, so a reshape here would
  break the very parity the snapshot proves. a route-complete state has no stone and no phase to
  name, so the comma pattern has no slot to fill
- **rework:** clean — one string in the render and its snapshots, if the commander wants it changed
- **confidence:** 95%. the doubt: the commander may want one shape across every state; that is a
  separate wish, never a side effect of a cpu fix
- **where:** the complete arm of the status line render; asserted at
  `src/contract/cli/routeStatusLine.acceptance.test.ts`
