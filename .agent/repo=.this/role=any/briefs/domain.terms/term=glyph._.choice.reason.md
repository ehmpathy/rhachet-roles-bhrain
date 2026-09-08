# domain.term.choice.reason: glyph

## .etymology

**glyph** — from the greek *glyphē*, a carved mark.

- it names **the mark itself**, independent of what medium carries it or what it stands for
- that independence is the property the register needs — one glyph is a readme header, a stdout
  prefix, a status-line artifact, and a declared `ReviewVibe` field, so one word must cover all four
- ⇒ each rejected word binds the mark to one medium or one register, so each is wrong on at least
  one of those surfaces

## .why not the rejected synonyms

- **emoji** — names the character set, not the role. it is also wrong at the edges: `🟡` and `✋`
  are dingbats with emoji presentation, and a register that calls itself an emoji list invites a
  reader to exclude them
- **icon** — carries a gui affordance: an icon is a control you click. a glyph marks; it never acts
- **symbol** — overloaded to exhaustion here. a symbol is a typescript primitive, a linker entry, a
  math operator, and a semiotic sign. a word with four senses cannot fix one
- **sigil** — perl and raku use it for `$`/`@`/`%` **type prefixes**, a different concept that also
  sits at the head of a name. the collision would be live

## .the axis structure

a glyph is claimed on an axis, and the catalog is itemized over that axis:

| axis | what it marks |
|---|---|
| `role` | which role holds the floor |
| `phase` | which phase of a route is live |
| `halt` | why a stone stopped |
| `rung` | a position on a ladder |
| `vibe` | who speaks, and in what tone |

⇒ the axes make the one-concept test answerable. two glyphs on two different axes are not in
conflict; two glyphs for one concept are.

## 🔴 .the one-concept test

**one glyph, one CONCEPT — never one glyph, one axis.**

| case | verdict |
|---|---|
| a role's glyph, reused for that role's own artifact | ✅ one concept, two axes |
| a phase glyph that IS the role at labor | ✅ one concept, two axes |
| two unrelated roles, one glyph | 🔴 collision |

a collision is expensive: a marker is a contract on every surface it prefixes, and a partial
swap is worse than none.

🟡 **check the type before you grade a collision.** the `ReviewVibe` type names its own two slots —
`mascot` for the repo's voice, `artifact` for the role's marker — so a glyph in the artifact slot
IS the role marker, on whatever surface that slot takes. the field names are the argument for
why `mascot` / `marker` / `artifact` are slots rather than synonyms.

## .the palette rule — the repair is the PALETTE, never the role

every **role marker** is drawn from the owl's own palette. when a marker is off-palette, **add it to
the palette.** an absent entry is a gap in the palette, not a defect in the role.

🟡 **the bound is the role axis.** a `rung`, `halt`, or `phase` glyph marks a state rather than a
speaker, so it is legitimately off-palette — see `catalog.of=glyph.axis=vibe.md`.

⇒ a rename moves every occurrence of a marker to fix a one-line omission.

## 🟡 .the boundary is UNSETTLED

*"a glyph of WHAT?"* has no one-word answer that reaches a declared term, so the gap is recorded
here per `rule.require.boundary-qualified-terms` rather than guessed at.

| candidate | for | against |
|---|---|---|
| `notation.` | a glyph is one mark in this repo's notation system | `notation` is not a declared term, so the chain reaches no root |
| `register.` | a glyph is an entry in the palette-plus-catalog register | names the container, not the context the word means what it means |
| root (dropped) | `glyph` is a repo-wide primitive, like `seed` — and the root segment is dropped by the rule | reads as an evasion unless the primitive claim is argued |

⇒ **plausibly the third**, and a primitive is what a flat name is for. it stays UNSETTLED until the
claim is tested against a second repo; a boundary guessed to satisfy the form is worse than one
recorded as open.

🟡 **it is not alone** — grep the glossary for `term.boundary = UNSETTLED` to see every open one.

## .disputes

none open.

## .evidence

- a collision, measured — `🔮` held by two roles: **68 occurrences across 10 files** to repair,
  54 of them acceptance snapshots. the achiever moved to `💎`
- a near-miss, measured — `🔍` reads as four claimants across four surfaces; a **~198
  occurrence** swap was drafted against that misread, and the `ReviewVibe` field names refuted it.
  `🔍` was off-palette until 2026-08-30 and was added rather than renamed
- a reserved glyph — `🔭` grepped clean for months while reserved for a researcher role; the
  role was declared 2026-08-30 and the glyph was never free
- a claimed marker swept as decoration, measured — 2026-09-06, an emphasis-density sweep ran
  **87 sites** for `rule.prefer.chill-nature-emojis` and took `💥 halted, guard malfunction` with
  it, off a halt surface a driver reads. the sweep was **right about `🔴`** (unclaimed prose
  emphasis) and **wrong about `💥`** (a claimed halt marker); the wisher reverted it —
  *"those were critical visual signals."* ⇒ the register's bound was already written and was
  crossed regardless, since a sweep matches a **pattern** rather than a **row**
- invariant: a glyph is claimed on **one axis, for one concept**, and it is drawn from the
  repo's palette. an off-palette glyph is repaired at the palette, never at the role
