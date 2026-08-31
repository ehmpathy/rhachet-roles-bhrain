# domain.term: glyph

term.chosen   = glyph
term.kind     = noun
term.boundary = UNSETTLED    # see .reason — no declared ancestor reaches a root yet
term.synonyms.forbidden:
- emoji
- icon
- symbol
- sigil

## .what
a **glyph** is **one character that marks one concept on a surface with no room for a word.**

it is a term, one layer down: the same one-concept-one-word law binds it, and it binds harder,
because a glyph prefixes every surface it marks rather than only the contracts that use it.

the register is a two-part contract, and **only the first part greps**:

```
im_a.bhrain_owl.md#.emojis                  # the PALETTE — what the owl may speak with
domain.glyphs/catalog.of=glyph._.md                # the CATALOG — what each glyph is claimed for
domain.glyphs/catalog.of=glyph.axis=$axis.md       # …one entry per axis: role, phase, halt, rung, vibe
```

⚠️ **a grep proves a glyph is UNUSED, never that it is UNCLAIMED** — a glyph may be reserved for
a role not yet declared, and it greps clean the whole time. only the catalog settles it.

## ⚠️ .a SLOT is not a synonym of the glyph that fills it

three words name **where** a glyph sits, and each is a distinct concept:

| word | the slot | example |
|---|---|---|
| **mascot** | the repo's voice, on every surface | `🦉` |
| **marker** | which role holds the floor | `🗿` driver, `📚` librarian |
| **artifact** | the `ReviewVibe` field that carries a marker | `{ mascot: '🦉', artifact: '🔍' }` |

⇒ so `mascot`, `marker`, and `artifact` are **not forbidden** — they name slots, and a glyph is
what fills one. to forbid them would collapse a real distinction the `ReviewVibe` type already
declares in its own field names.

## .refs
where the term composes declared contracts:
- .agent/repo=.this/role=any/briefs/domain.glyphs/catalog.of=glyph._.md          # the index
- .agent/repo=.this/role=any/briefs/domain.glyphs/catalog.of=glyph.axis=*.md     # one per axis
- .agent/repo=.this/role=any/briefs/define.bhrain-repo-mascot.md          # the role axis
- src/domain.roles/learner/briefs/im_an.obsessive_learner.for.domain.glyphs.md   # the capture rule
- src/domain.roles/driver/briefs/im_a.bhrain_owl.md                       # the palette

## .reason
see the ref-level cluster beside this choice:
- `term=glyph._.choice.reason.md` — etymology, the rejected synonyms, and the two collisions
