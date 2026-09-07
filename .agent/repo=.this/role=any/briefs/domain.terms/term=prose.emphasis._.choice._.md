# domain.term: emphasis

term.chosen   = emphasis
term.kind     = noun
term.boundary = prose
term.synonyms.forbidden:
- marker
- highlight
- accent
- stress

## .what
`emphasis` is **any device that claims *"this line outranks its neighbours"*** — a glyph, a bold, a
caps, a 🟡, or a stack of them on one line.

it is settled by the claim it makes, never by the character it uses. the claim is relative, so
repetition destroys it: emphasis on every line ranks no line.

two properties — **position** and **extent** — settle whether a given mark makes that claim at all.
the table that grades them is declared by `src/domain.roles/telepath/briefs/rule.forbid.emphasis-noise.md`
under `.the question that sorts it`; amend it there.

⇒ what the glossary takes from it: the same character is emphasis or structure by where it sits and
how far it reaches. **a reader who takes `emphasis` as a property of the SYMBOL will grade `🟡` an
emphasis everywhere it appears** — which is the misread this cluster exists to bar.

## 🟡 .`marker` is forbidden here, and it is the trap

`marker` is declared (`term=glyph._.choice._.md`) for the role slot — `🗿` driver, `📚`
librarian. that sense classifies; this one ranks. the two are opposite acts, and the question
that parts them is the one `rule.forbid.emphasis-noise` states:

> **does this mark RANK a line against its neighbours, or CLASSIFY it?**

⇒ the same glyph can be either, decided by the claim rather than the character. `🗿` in a header
classifies; `🔴` on a body line ranks.

## .the peer terms it does not name

| word | what it is | why not `emphasis` |
|---|---|---|
| `glyph` | one character that marks one concept | a **form** emphasis may take, and it may take three others |
| `marker` | the role slot a glyph fills | it classifies |
| `mascot` | the repo voice slot | it classifies |
| structure — a table, a nest, a header, a fence | shape | it organizes; it ranks no line |

## .refs
where the term composes declared contracts:
- src/domain.roles/telepath/briefs/rule.forbid.emphasis-noise.md      # the rule named for it
- src/domain.roles/telepath/briefs/rule.forbid.diffusion.md           # its opposite failure
- src/domain.roles/telepath/boot.yml                                  # the say-tier wire

## .reason
see the ref-level cluster beside this choice:
- `term=prose.emphasis._.choice.reason.md` — etymology, the rejected synonyms, and the collision
  with `marker` that forced the word
