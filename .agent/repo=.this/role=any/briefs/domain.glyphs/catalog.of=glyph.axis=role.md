# catalog.of=glyph.axis=role

## .what

the glyphs that mark **which role speaks**. one per role, drawn from the owl's palette, chosen so
the glyph names what the role does.

## .the members

| glyph | role | names |
|---|---|---|
| 🗿 | driver | stones enroute — a moai is a carved stone that marks a place |
| 💎 | achiever | pressure into what endures |
| 📜 | learner | what is written down outlives the round |
| 📚 | librarian | a collection, curated |
| 🔍 | reviewer | a close look at an artifact against declared rules |
| 🔮 | telepath | the concept transferred whole, without the words |
| 🪐 | thinker | cosmic, vast — the whole space of a problem |
| 🌕 | reflector | illumination — shine back what was already there |
| 🔭 | researcher | far sight, truth seeker — what is not yet held |

## 🟡 .📚 and 🔭 are one practice, split on one question

the pair is the closest in this register, so the seam matters here — and it is declared in
`src/domain.roles/researcher/readme.md` under `.the seam with the librarian`, not restated here.

⇒ what this register adds: a librarian **curates**, a researcher **acquires**, and the two glyphs
part on that verb. the handoff is the research route's last phase, `briefs.curate`.

🟡 **a marker may be reserved long before its role exists.** `🔭` sat in the owl's palette while
`init.research` still lived under the librarian — so a grep for it returned no match and it was
still not free to claim. **a grep proves a glyph is unused; only this register proves it is
unclaimed.**

## .the surfaces a role marker appears on

| surface | example |
|---|---|
| a role readme | `## 🔍 reviewer` |
| a skill's stdout prefix | `🔍 review.by --role mechanic` |
| a route status line | `🗿 1.vision, review.self, r7/r10 🔍` |
| a `ReviewVibe`'s `artifact` field | `{ mascot: '🦉', artifact: '🔍' }` |

⇒ all four are one marker. `ReviewVibe` names the split outright: `mascot` is the repo's voice,
`artifact` is the role's marker.

## 🟡 .the marker never carries the mascot

**the marker stands alone: `📜`.** the owl is already the voice on every surface, so `🦉📜 learner`
claims a mascot every other role holds equally — and it breaks the one-glyph-per-role shape a
reader scans by.

## .see also

- `define.bhrain-repo-mascot` — the rule, the two tests, and the claim procedure
- `catalog.of=glyph._.md` — the index across every axis
