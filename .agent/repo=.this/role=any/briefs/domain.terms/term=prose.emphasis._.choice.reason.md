# domain.term.choice.reason: emphasis

## .etymology

latin *emphasis*, from greek *émphasis* — literally *"a show forth"*, from *en-* (in) + *phaínein*
(to show). the greek sense is rhetorical: to make one part of an utterance stand out against the
rest.

⇒ the word carries the **relative** claim in its own root. to *show forth* is to show forth **from**
something, so a device that emphasizes every line has shown naught forth. **the etymology names the
defect the rule forbids.**

no other candidate has that property, and it is what settled the choice.

## .the collision that forced the word — `marker` was already taken, by its opposite

the rule now called `rule.forbid.emphasis-noise` was first drafted with `marker` as its head noun,
used ~38 times across the source and its `.md.min`.

`marker` is declared at `term=glyph._.choice._.md:36`, where it names one of three slots a glyph
can fill:

| slot | what it names | example |
|---|---|---|
| `mascot` | the repo voice, on every surface | `🦉` |
| **`marker`** | **which role holds the floor** | `🗿` driver, `📚` librarian |
| `artifact` | the `ReviewVibe` field that carries a marker | see the type, quoted at `term=glyph` |

🟡 and it is not a loose usage — `ReviewVibe` is a declared type whose own field names carry the
distinction, so `marker` is bound to a **contract**, not merely to prose.

### .they are two concepts, never one word in two contexts

`rule.forbid.domain-term-ambiguity` says the repair for an overload is a second word, unless the
two senses differ by *context* rather than by concept — in which case the repair is a boundary
(`rule.require.boundary-qualified-terms`).

so the question was real, and a property table settles it. that table is declared by
`src/domain.roles/telepath/briefs/rule.forbid.emphasis-noise.md` under `.the word is emphasis, and
marker is taken by its opposite`; amend it there.

⇒ **the conclusion is this cluster's, and it is what the rule does not carry: four axes, four
inversions.** a boundary (`glyph.marker.role` against `glyph.marker.emphasis`) would give the two a
shared head noun whose properties agree on no axis at all. **that is a second word, not a second
context** — which is the call `rule.forbid.domain-term-ambiguity` sends here to be made.

### the sharpest evidence: the rule drew the seam and never named it

the rule's own rank-or-classify question predates the collision — it is quoted in this cluster's
say file, `term=prose.emphasis._.choice._.md`.

`marker` — as declared — is on the classify side. the rule bounds the rank side, and used
the classifier's word for it throughout.

⇒ so the overload was not a near-miss between two adjacent senses. **the rule was named for one
half of a distinction it stated on its own page, and borrowed the word that names the other half.**

## .the rejected candidates

enumerated per `rule.require.enumerate-before-you-name` — the word had to cover all six forms the
rule bounds, and exclude the five it exempts.

**must cover:** a 🔴 glyph on a line · a **bold** span · a caps word · a 🟡 prefix · a stack of two
or more on one line · a glyph on every row of a table.

**must exclude:** a role marker 🗿 · a state glyph ✅ 💥 🌙 · a provenance mark · a mention · a
table, a header, a nest, a fence.

| candidate | covers all six? | excludes the five? | verdict |
|---|---|---|---|
| **`emphasis`** | ✅ | ✅ — a classifier does not emphasize; structure organizes | ✅ **chosen** |
| `marker` | ✅ | ❌ taken, and by a classifier | rejected — the collision above |
| `mark` | ✅ | ❌ too wide — a provenance mark and a state glyph are both marks | rejected |
| `stress` | ✅ | ✅ | rejected — prosodic term of art; it reads wrong applied to a glyph |
| `accent` | ✅ | 🟡 collides with a diacritic | rejected |
| `highlight` | ✅ | 🟡 connotes a ui affordance, not a claim about rank | rejected |

⇒ `mark` is the near-miss worth a note: it is morphologically the same word as `marker`, so it would
have re-opened the collision one letter later.

## .the word was already on the page

`rule.forbid.emphasis-noise` was **named** `emphasis-noise` from its first draft, and its headline
read *"emphasis is a scarce signal"* — while its body used `marker` throughout.

⇒ so the repair reached for pavement already laid rather than a coinage
(`rule.always.reuse-pavement-before-improvise`). **the filename held the right word before the prose
did**, which is a cue worth a generalization: when a brief's own title and its body disagree on a
head noun, the title is usually the one that was chosen deliberately.

## .the repair was by hand, never a sweep

38 of 42 occurrences moved to `emphasis`; four did not — the false-positive lines that cite the
declared sense, *"a declared role or phase marker"*.

🟡 **a find-and-replace cannot part a citation of a word from an instance of it**, which is the
same hazard `rule.forbid.brackets-in-filenames` records for its own cleanup. so the repair was
file-first and by hand, and that cost is part of what an overload charges.

## .the boundary POSITION draws — settled 2026-09-05

the `marker` collision above parts emphasis from a role glyph. a second boundary surfaced a day
later, and it parts emphasis from structure:

> a glyph at a line's LEAD labels the kind of line that follows — `🟡` a caveat, `⇒` a
> conclusion, `>` a quote. that classifies, so it is structure and `emphasis` does not bound it.
> the same glyph mid-line, or on some table rows and not others, ranks — and is bounded.

🟡 **the same glyph sits on both sides of the term, and only its position says which.** so
`emphasis` is not a property of a symbol; it is a property of a symbol IN A PLACE. a reader who
takes it as a property of the symbol will grade `🟡` an emphasis everywhere it appears.

### what forced it

a scanner counted 206 lines across 57 files where a lead glyph sits beside a bold — the house
form of every role in this repo. read as two marks on one target, `rule.forbid.emphasis-noise`
condemned its own corpus.

⇒ **a term whose enforcement would condemn 57 files has its boundary wrong, not its corpus.** the
measurement is what made that legible; a read of any single line would have looked defensible.

## .the boundary EXTENT draws — settled 2026-09-05, the same day, and it is POSITION's peer

position parts emphasis from structure by *where* a mark sits. extent parts them by *how much of its
container the mark covers*:

> a mark that spans its **WHOLE container** LABELS that container. one that spans **PART** of a
> container RANKS the rest of it.

⇒ `| **diffusion** |` labels a row · `- **2 · name the outcomes**` labels a bullet · `## 🔴 …`
labels a section · `**the claim.** then its ground` ranks a clause against its line.

### what forced it

three detectors re-derived this predicate separately, each from its own false positive and each
without reference to the others: a table-column guard, a table-stack guard, and an outline-bullet
guard. a fourth followed — a bold inside a backtick span, which markdown renders as literal
asterisks and no reader sees as emphasis at all.

🟡 **a property a reader must re-derive per container is a property the term never declared** — so
the term had a second one that no artifact stated, and every consumer paid to re-derive it.

⇒ this is the same shape as the position boundary above, and the pair now bounds the term whole:
emphasis is a property of a mark's PLACE and its EXTENT, never of its character.

## .evidence

- discovery: a term sweep on 2026-09-04, within the telepath canon behavior
  (`.behavior/v2026_09_04.feat-telepath-role`)
- the extent boundary: four independently-derived detector exemptions on 2026-09-05, same behavior —
  now stated once in `rule.forbid.emphasis-noise.md.min`, `.the question that sorts it`
- the boundary: a glyph+bold scan on 2026-09-05, same behavior — 206 lines / 57 files, which
  settled that position decides rank-vs-classify (`rule.forbid.emphasis-noise`, `.the forms` and
  `### position settles which of the two a glyph performs`)
- the collision: `term=glyph._.choice._.md:36` vs `rule.forbid.emphasis-noise.md`, ~38 occurrences
- the governing rules: `rule.forbid.domain-term-ambiguity` (one word, one concept) ·
  `rule.require.enumerate-before-you-name` (list the instances, then pick)

## .disputes

none open.
