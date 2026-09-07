# rule.forbid.domain-term-ambiguity

> **one word, one concept.** a term that is overloaded — the same word used for two or more distinct senses — is ambiguous, and an ambiguous term in a contract is forbidden.

a **contract** = a dobj/dop name, an internal contract (shapes, signatures), and above all the external interfaces we publish (api, sdk, cli).

## .why

- it is the **twin hazard of the synonym** — a synonym is many words for one concept; an overload is one word for many. both break the vocabulary the glossary keeps
- an overloaded term forces every reader to disambiguate by context — friction on every read
- 🔴 **the overload hides an ABSENT DISTINCTION.** two concepts wear one name because the second was never granted its own word. the ambiguity is the symptom; the unnamed concept is the defect

## .the test

> **does this word name exactly ONE concept, everywhere it appears?**

one sense → adhere · two or more → the word is overloaded, and one of the two repairs below is owed.

## .the two repairs — and only one of them coins a word

🟡 **the intuitive read is that an overload always costs a new word. it does not**, and the cheaper repair is the one an author reaches for last.

| the senses differ by… | the repair | what it costs |
|---|---|---|
| **concept** — two genuinely different things | **split.** keep the word for its primary sense; coin a distinct term for each other sense | a new word, itemized, plus every citation of the old one |
| **context** — one concept, two boundaries it sits within | **qualify.** `rule.require.boundary-qualified-terms` | a filename segment. no coinage, no dispute |

⇒ **the flat namespace has one slot per word; a qualified one has as many as the domain does.** so an overload that is really a boundary gap discharges for a segment, and a split there would coin a synonym the glossary then has to forbid.

🟡 **the sort is the same question `rule.require.boundary-qualified-terms` asks: *"$word, of WHAT?"*** two answers means two boundaries, and two boundaries is the qualify row. one answer with two referents under it is the split row.

## .the cues

| when… | then… |
|---|---|
| you reach for a word this repo already declares | 🔴 read its cluster first. a second sense on a declared word is this defect |
| you would write *"it means X here, Y there"* | that sentence IS the overload, stated aloud |
| a reviewer asks *"which one do you mean?"* | the strongest cue there is. a reader who must ask has already paid the friction |
| you settle an **inconsistency** — one concept, two words | 🔴 check whether the word you keep was ALSO overloaded. the two defects are inverses, and to repair one does not touch the other |
| a foreign sense sits in a **published flag or path** | it is a live contract overload, and the boundary qualification is what discharges it |
| you cannot name the second sense in one phrase | the second concept is undiscovered. record the gap rather than guess a word |

## 🔴 .the inconsistency repair does not discharge an ambiguity — and it can FORBID its own cure

`rule.forbid.domain-term-inconsistency` takes one concept named two ways and settles on one word. this rule takes one word that carries two concepts and grants the second its own. **the two look adjacent and their repairs do not compose.**

⇒ **measured in this repo:** `lane` and `reviewer` named one concept, so the inconsistency repair ran and `lane` became a forbidden synonym. but `reviewer` was *also* overloaded — the role, and one run of one rubric on one guard — and `lane` had been the one candidate word for that second sense.

- the settlement closed the inconsistency
- ⇒ and it removed the ambiguity's only extant cure in the same edit
- the run-sense now has no word, in a contract (`contract.reviewer-output`), which this rule grades a blocker

🟡 **so the order matters, and the intuitive order is wrong.** enumerate the senses of the word you keep *before* the inconsistency settles, never after — afterward, the word you would have reached for is forbidden.

## .the worked cases

| the word | the two senses | the repair taken |
|---|---|---|
| `rung` | a review gate · a position on the determinism ladder | **qualify** — `term=route.guard.rung` |
| `absolute` | a quantifier (*"it never fails"*) · a coordinate system (an absolute path, `symlink --mode absolute`) | **qualify** — `term=prose.absolute`. the foreign sense sits in a published cli flag, so it is a live contract overload |
| `reviewer` | the role · one run of one rubric on one guard | 🔴 **open** — see the section above |

⇒ two more are itemized and unsettled: `gap=flake.md` and `gap=sentinel.md`. the authoritative set is the census at `.agent/repo=.this/role=any/briefs/domain.terms/.readme.md` — this table is an index of the worked ones, never a count of the open ones.

## .the boundary

| a violation | not a violation |
|---|---|
| one word, two concepts, in a dobj/dop name | one word, two concepts, in **prose** that names the sense it means |
| an overload in a published flag, path, or field | a **qualified** pair — `route.guard.rung` and `tool.skill.rung` are two terms, not one overloaded |
| a second sense added to a declared word | a **generic english** word that composes no domain concept |
| an overload recorded as *"obvious from context"* | an overload recorded as an open gap, with both senses named |

**the line that parts them: can a reader settle which sense is meant from the CONTRACT alone?** yes → it is qualified, however similar the words read. no, they must read the prose around it → an overload, however obvious it feels to the author.

## .how

1. **name the senses** — enumerate the distinct concepts the one word carries. do not skip this: the count is what selects the repair
2. run the boundary test — two answers to *"$word, of WHAT?"* → qualify; one answer, two referents → split
3. itemize whichever the repair produces (`rule.require.domain-term-itemization`) and record the split in the `.reason`

> one word, one sense — no term does double duty 📜

blocker: a domain term overloaded across two or more distinct concepts in a contract · an inconsistency settled with no check of whether the word kept was also overloaded · a second sense added to a declared word with no cluster behind it.
nitpick: an overload recorded as a gap with only one of its senses named.
false positive: a boundary-qualified pair · generic english that composes no domain concept · a synonym, which is `rule.forbid.domain-term-synonyms`' subject and not this one.

⇒ see also: `rule.require.boundary-qualified-terms` (the cheaper of the two repairs) · `rule.forbid.domain-term-inconsistency` (the inverse defect, whose repair can forbid this one's cure) · `rule.forbid.domain-term-synonyms` · `rule.require.enumerate-before-you-name` (the sense count this rule opens on) · `howto.domain-term-disputes`.
