# rule.forbid.width-ambiguous-glyphs

> **do not use `⚠️`. reach for `🟡`.**

`⚠️` is `U+26A0`, which UAX #11 marks `East_Asian_Width=Ambiguous` — its column count is a
property of the reader's **locale**, not of the character. a terminal reserves 1 cell where an
emoji font paints 2, so every column to the right of that line shifts, and no error reports it.

🟡 **the author is the one reader who cannot see it**, because the width is set by the reader's
locale. so the class is checked against UAX #11, never judged from a render.

## .the test

> **what is the glyph's `East_Asian_Width` class?**

`A` → the defect · `W` or `N` → it renders.

⇒ mechanical: `node .agent/.notes/tool.probe-vs16-class.js` prints the class. the palette was
walked 2026-09-07 — 25 of 26 are `W`, and `⚠️` is the exception.

## .the boundary

| a violation | not a violation |
|---|---|
| an **Ambiguous** glyph — `⚠️` `U+26A0`, `⏱️` `U+23F1` | a Wide glyph, whatever the mascot |
| a second glyph for a concept the palette already marks | a **Neutral + `U+FE0F`** glyph — `📽️` `🕹️` `🗺️` render on any UTS #51 terminal |
| a **cited** foreign marker swapped rather than left alone | a text symbol used **as text** — `⇒` `·` `→` |

🟡 **a `U+FE0F` is not the test.** the selector sits on both classes, so it names the cohort and
never whether the glyph renders. read the **base** codepoint's class.

🟡 **a foreign role's marker is a fact about that role.** swap it here and the render is clean and
the report is false — `forbid.obfuscation` grades the false report worse. leave it.

blocker: an **Ambiguous** glyph in prose, stdout, or a header · a second glyph coined for a concept
the palette already marks · a cited foreign marker swapped.
false positive: a Neutral + `U+FE0F` glyph · a text symbol used as text · a verbatim quote · a Wide
glyph off this repo's palette but on the adopter's.

⇒ see also: `rule.forbid.emphasis-noise` (it grades the COUNT of marks; this grades the mark's
RENDER) · `term=glyph._.choice.reason.md` (the one-concept test) ·
`domain.glyphs/catalog.of=glyph._.md`.
