# domain.term.choice.reason: prose

## .etymology

**prose** — from latin *prosa oratio*, "straightforward speech", itself from *prorsus* (straight
ahead), a contraction of *proversus* — "turned forward".

⇒ the etymology carries the property the canon is built on: **prose is speech turned toward its
reader.** the latin sense parts it from verse by its *direction*, never by its ornament — which is
the same axis this repo grades it on.

## .why not the rejected synonyms

- **text** — the near-miss, and it fails by breadth. `text` covers json, a lockfile, and a path,
  which are the three things this term must exclude. a word that covers its own exclusions cannot
  discriminate (`rule.require.enumerate-before-you-name`)
- **copy** — the ad trade's word for text written to persuade. 🟡 it names precisely what
  `rule.forbid.subversive-prose` forbids, so to adopt it would name the canon after its own defect
- **writing** — a gerund, forbidden outright (`rule.forbid.gerunds`)
- **wording** — a gerund, and it names the *choice of words* rather than the artifact. the canon
  grades structure, order, and depth as much as diction
- **language** — the system, never an instance of it. a rule cannot grade "language"; it grades one
  passage at a time

## .the scope was settled by the wisher, and it is wider than it reads

> the wisher, verbatim (2026-09-04, on fulcrum F07): *"it applies to code comments too … literally
> any prose"*

🟡 **that settlement is what makes the term carry weight.** the reviewer's subject was proposed at
`.behavior/` prose files alone; the wisher widened it, and the wider scope is what forces a declared
word — *"prose"* under the generic sense would not obviously include a jsdoc header, and under this
sense it plainly does.

## .why a boundary of seven words sat headless

`prose` was spoken in a declared rule name (`rule.forbid.subversive-prose`) from the day that rule
was written, and in a role readme before that. it was never declared.

**it surfaced the way every gap in this glossary has: a reader needed it and could not find it.**

| the round | what happened |
|---|---|
| 2026-09-04, earlier | the `enumerate` dispute wrote counter #2: *"if it earns a home it is `term=prose.enumerate`"* — and named a boundary that did not exist |
| 2026-09-04, this round | the wisher coined `bulletize`; it wanted the same absent home |

⇒ **two words in one day reached for the same boundary and found none.** the first author (me)
wrote the path and did not check it; the second occurrence is what made the absence legible.

**so the tell repeats exactly as `term=route.guard.review.reviewer` recorded it: the undeclared
word is not the rare one. it is the one so common that its absence reads as a background fact.**
`prose` is in the name of a booted rule, a role's purpose line, and this behavior's entire wish.

## .evidence

- **code + contracts**: `rule.forbid.subversive-prose` (booted say-tier),
  `rule.require.bulletize`, `rule.forbid.narration`, and telepath's `readme.md` all compose the
  word. `rule.require.domain-term-itemization` binds each of them
- **the exclusion list is checkable**: the three excluded kinds each have a rule family that already
  governs them — code (mechanic's `lang.terms/`), coordinates
  (`rule.forbid.itemization-without-coordinates`), structured data (its own schema). ⇒ the boundary
  is drawn where another owner begins, never arbitrarily
- **invariant**: a passage is prose **or** it is one of the three excluded kinds. an artifact may
  hold both — a `.ts` file holds code and comments — and the rules grade only the prose in it

## .disputes

none. the word is the wisher's own throughout, and no contract has drifted from it.
