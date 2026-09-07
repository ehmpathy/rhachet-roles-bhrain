# rule.forbid.emphasis-noise

> **emphasis is a scarce signal. spend it on every line and you have marked none of them.**

emphasis — a glyph, a bold, a caps, a 🟡 — claims *"this outranks its neighbours"*. that claim is
**relative**, so it is destroyed by repetition rather than strengthened by it.

## .why

- emphasis on one line in fifty says *read this one first*
- emphasis on one line in ten says *the author was anxious*
- emphasis on every line says **naught**, and costs a glance per line to learn it says naught

⇒ so the defect is not that emphasis is ugly. it is that **the reader loses the ability to rank**,
which is the one service emphasis performs.

🟡 **and it degrades the artifact it is meant to help.** an author reaches for emphasis when they
fear a point will be missed — so the highest density lands on the longest, densest passages, which
are exactly the passages where a reader most needs a rank.

## .the word is `emphasis`, and `marker` is taken by its opposite

`marker` is declared, and it names a **role** slot — `🗿` driver, `📚` librarian
(`term=glyph._.choice._.md`). that sense **classifies**: it names which speaker holds the floor.
this rule bounds the sense that **ranks**.

🟡 they are two concepts, not one word in two contexts, and every property inverts:

| | a role `marker` 🗿 | `emphasis` 🔴 |
|---|---|---|
| bounded in count? | no — one per role, a fixed set | yes — one per section |
| destroyed by repetition? | no — 🗿 on every driver line is correct | **yes, and that is the defect** |
| can be a bold or a caps? | no — it is a glyph | yes |
| claims a relation to its neighbours? | no — it names a speaker | yes |

⇒ so `emphasis` is the head noun here, never `marker`. **the two words sort by the question in
`.what emphasis still earns` below**, which is the same seam read from the other side.

## .the test

> **can a reader find the ONE line that matters most?**

- yes, and emphasis points at it → correct
- yes, and none was needed → cut it
- **no, because several lines are emphasized** → that is this defect
- no, because none is and the point is buried → that is `rule.forbid.diffusion`

## .the seam with `forbid.diffusion`

they are the two failures of one act, and their repairs run opposite:

| | the failure | the repair |
|---|---|---|
| `forbid.diffusion` | the needle is **buried** — no line is elevated | elevate one line |
| this rule | every line is **elevated** — so no needle exists | cut back to one |

⇒ a passage can fail both at once: many emphasized lines, and the actual needle unmarked among them.

## .the bar

**one emphasized line per section, at most.** if a second line in the same section needs it, the
section is two sections, or the first one was misplaced.

🟡 this bounds **emphasis**, never **structure**. a table, a nest, a header, a code fence are shape
rather than emphasis, and none is bounded here.

## .the forms it covers

| form | the noisy shape |
|---|---|
| a glyph | a 🔴 or 🟡 on more than one line of a section |
| bold | every clause of a sentence bolded, so the sentence has no stress |
| caps | a WORD in caps where the sentence already carries the stress |
| a stack | two or more forms on one line — a glyph plus a bold plus a caps |
| a table column | a glyph on every row, which marks the column rather than a row |

⇒ **the stack is the sharpest.** each form alone is arguable; together they announce that the author
did not trust the words to carry it.

## .the measured case

this rule was written after a reader asked *"why so many 🔴"*. the artifact behind that question:

> `progress.2026-09-04.md` — **44 of its 474 lines** carry `🔴`. roughly one line in eleven.

and the author was, in the same file, at work on the glossary and on a canon whose subject is
signal. **the rule that would have caught it did not exist, and its absence was invisible from
inside the prose it should have graded.**

⇒ the reader caught it in one glance. that is the tell: **density is legible to a reader at a
distance, and illegible to the author at the keyboard**, because the author reads their own intent
onto each mark.

## .what emphasis still earns

| legitimate | why |
|---|---|
| the one point a reader must not miss | that is the whole job |
| a state in structured output — ✅ pass, 💥 fail, 🌙 skip | it is a value in a column |
| a role or phase marker in a header | declared in the glyph catalog, and it names a speaker |
| a provenance mark, cited on the same row | it reports rather than ranks |
| a mention — a glyph named as the subject of a sentence | it is a quoted token; it ranks no line |
| a lead glyph — `🟡` a caveat, `⇒` a conclusion, `>` a quote | at a line's head it labels that line's kind |

⇒ the question that sorts it: **does this mark RANK a line against its neighbours, or CLASSIFY it?**
rank is bounded here; classify is not.

### position settles which of the two a glyph performs

the lead row above is the one an author will dispute, so it is worth its own paragraph.

a glyph at a line's **head** labels the kind of line that follows — a caveat, a conclusion, a
quote. that is structure, and structure is exempt. so a bold beside it marks a span *within* the
line rather than a second mark on the same target:

```md
👍  🟡 **the claim.** then the ground that supports it.
👎  a **bold** here and a 🔴 **bold** there, in one clause
```

the same glyph **mid-line**, or on some rows of a table and not others, ranks — and is bounded.

⇒ the practical consequence: `🟡 **x**` is legal and is the house form across every role in this
repo. **had the answer gone the other way, this rule would have condemned 206 extant lines in 57
files**, which is a corpus rewrite rather than a rule.

🟡 **the mention row carries load, and is no technicality.** a rule about emphasis must print
emphasis, and its examples must show the noisy form. **without the mention carve-out this rule is
unwritable, and so is every review comment that quotes a violation.**

## .enforcement

blocker: a section with more than one emphasized line · a stack of two or more forms on one line ·
a glyph on every row of a table where it ranks rather than classifies.
nitpick: a bold that covers a whole sentence rather than its stress.
false positive: a state glyph in structured output · a declared role or phase marker · a provenance
mark cited on its row · a single emphasis on the one point that matters.

## .the axis

a **structure** rule, so telepath owns it (`rule.require.generic-governs-structure-never-voice`). it
bounds how many lines may be ranked, so it prescribes no member of that rule's voice row — an owl
and a seaturtle obey it identically, each with their own palette.

## .see also

- `rule.forbid.diffusion` — the opposite failure of the same act
- `rule.require.reflexive-condensation` — the peer pass: emphasis often stands in for a cut that was
  owed. rank the lines, drop the low ones, and the line that remains needs none
- `domain.terms/term=glyph._.choice._.md` — where `marker` is declared, and why it is not this word
- `domain.glyphs/catalog.of=glyph._.md` — which glyphs classify, and are therefore exempt
