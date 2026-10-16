# S55 — the ⚠️ glyph is forbidden, and the ban is enforced, not merely catalogued

- said 2026-10-13, after a review of the grove render's caution marks and the unmeasured-spend
  caveat rows

## .said

> forbid use of ⚠️

## .settled

- the ban binds rendered output: ⚠️ appears in no stdout, stderr, or snapshot this repo ships.
  that covers prod string literals that reach a stream, shell echo and printf output, snapshot
  bodies, and test titles (a title is a snapshot key)
- briefs, code comments, and test prose may still carry ⚠️ — the glyph kinks a column only where a
  terminal renders it, so the sweep was narrowed to rendered output to keep the diff small
- where a caution mark earns its place in output, the mark is 🟡 — the glyph catalog already names
  it the one symbol for that concept, and already lists ⚠️ as forbidden (a 1-cell glyph that kinks
  every column under it)
- where the mark was noise, it goes, and plain words carry the caveat
- the ban is held by a clamp that fails on any ⚠️ in a snapshot body under `src/` or `blackbox/` —
  a catalog row alone did not hold it

## .landed

- `src/.test/forbidWidthAmbiguousGlyph.integration.test.ts`
- `.agent/repo=.this/role=any/briefs/domain.glyphs/catalog.of=glyph._.md`
