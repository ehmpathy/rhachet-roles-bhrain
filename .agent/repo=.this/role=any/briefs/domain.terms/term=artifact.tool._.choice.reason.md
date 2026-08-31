# domain.term.choice.reason: tool

## .etymology

adopted from ordinary english, and kept because the ladder needs a word for *the whole class of
externalized products* — the thing a brief and a solid skill both are.

rejected alternatives:

| word | why not |
|---|---|
| `artifact` | broader than the class. a route yield, a seed, a progress file are all artifacts and none is pavement a traveler reuses instead of re-derives |
| `mechanism` | implies moving parts, so it reads past a 📚 brief — which has none and is still rung 1 |
| `automation` | names rung 4 alone. it would make rungs 1–3 sound like failures to arrive, the same defect `rigid`-not-`partial-tool` avoids |

## .disputes

### dispute: tool-as-the-contrast-against-a-brief  —  raised 2026-08-30  —  status: RESOLVED (umbrella)

- raised.by  = the wisher
- claim      = `philosophy.entoolment-is-the-pinnacle` used `tool` twice in two senses — once as
               the umbrella (*"every one of them is a tool"*) and once as the half a brief is
               contrasted against (*"a brief and a tool amortize different things"*). the wisher
               named it directly:

  > *"is this supposed to say 'a brief and a skill amortize different things'? … caus a brief _is_
  > a tool - as we established aerlier"*

  ⚠️ verbatim, unedited.

- counter    = the contrast sense is the older colloquial one, and it reads naturally in a
               sentence. keeping both senses costs no reader anything until one asks which is which
- resolution = **`tool` is the umbrella, and only the umbrella.** the contrast word is `skill`.
               one word for two concepts is what `rule.forbid.domain-term-synonyms` forbids
               outright, and the umbrella sense is the one the ladder's whole thesis rests on:
               *every rung is a tool; they differ only in imagine cost per use.* the contrast sense
               would quietly restore the tool-vs-not-tool split the philosophy exists to retire

### dispute: brain-turns vs rhachet's `imagine cost`  —  raised 2026-08-30  —  status: RESOLVED (⚠️ SUPERSEDED — see the entry below)

- raised.by  = the learner, on a read of upstream
- claim      = the ladder ranks its rungs by **brain-turns per use**, a phrase coined here. but
               `ehmpathy/rhachet` already declares the same measure with its own vocabulary:

  > *"**imagine cost** = time + tokens to have brain figure out what to do · **compute cost** = cpu
  > cycles to execute deterministic logic … to harden a route = to shift work from imagine-cost to
  > compute-cost."*
  > — `define.term.skill.thought-routes.md`

  we adopted rhachet's rungs and glyphs and then renamed its cost metric. that is a synonym for a
  concept upstream already names, which `rule.forbid.domain-term-synonyms` forbids outright.

- counter    = `brain-turns` is **countable per call** where `imagine cost` is a magnitude, and the
               ladder's whole argument is a count — *"how many brain-turns did that one call cost
               me?"* is the test `rule.always.entool-the-skills-you-touch` asks. `imagine cost`
               cannot be asked that way without a unit
- resolution = **not a synonym — a MEASURE and its UNIT.** settled 2026-08-30 by an enumeration of
               every use the word must cover (`rule.require.enumerate-before-you-name`):

  | the use | `imagine cost` | `brain-turn` |
  |---|---|---|
  | *"the ladder ranks rungs by cost per use"* — a magnitude | ✅ | ⚠️ awkward |
  | rhachet's *"shift work from imagine-cost to compute-cost"* | ✅ | 🔴 no |
  | *"how many did that ONE CALL cost me?"* — a count | 🔴 no unit | ✅ |

  neither word covers all three, so **neither can replace the other** — which is precisely the test
  `rule.forbid.domain-term-synonyms` asks, and it comes back *two concepts*. they stand as
  **distance and metre** stand: `imagine cost` is rhachet's measure, adopted unedited; **a
  brain-turn is one unit of it.**

  ⇒ so the repair is an **addition, never a sweep.** the ~6 briefs that count brain-turns are
  correct as written; what was absent was the one line that declares the relation, so a reader of
  both vocabularies could see they are one scale rather than two rival ones. that line now sits in
  `philosophy.entoolment-is-the-pinnacle._.md`.

  ⚠️ **the escalation this entry once carried was unearned.** it asked the wisher to choose between
  the two words, and the enumeration shows there was never a choice to make — the question was
  answerable in-repo, by the repo's own test, and it cost one table

### dispute: `brain-turn` is an INDIRECTION  —  raised 2026-08-30  —  status: RESOLVED (eliminate `brain-turn`)

- raised.by  = the wisher, on a read of the entry above
- claim      = verbatim, unedited:

  > *"brain turn is indirection. tokens & time is the root cost. (that and risk from
  > probability)"*

- counter    = the entry above argued `brain-turn` was a **unit** of `imagine cost`, as a metre is
               of distance, and that the ladder's test is a count
- resolution = **`brain-turn` is a forbidden synonym. eliminated.** the metre analogy fails on the
               property that makes a metre useful: **a metre is INVARIANT and a turn is not.**

  | | a metre | a brain-turn |
  |---|---|---|
  | is every instance the same size? | ✅ by definition | 🔴 they differ by orders of magnitude |
  | does a count of them give the magnitude? | ✅ | 🔴 a count of turns gives neither the time nor the tokens |

  ⇒ so a count of brain-turns is **not a measurement** — it is a tally of events of unknown size,
  which reads as a measurement and carries no magnitude. that is what makes it an indirection
  rather than a unit: it stands between the reader and the two quantities they actually need.

  **and the counter's premise was wrong too.** the ladder's test does not need a count. *"what did
  I still have to figure out myself?"* names the leftover **work**, which is what you can entool —
  where a count of turns is not.

  🔴 **the wisher also named a cost the entry above omitted entirely: RISK from probability.** a
  probabilistic step can be *wrong*, not merely slow, so its output must be checked. neither
  `imagine cost` nor `brain-turn` carries that, and it is often the largest of the three. it is now
  stated in `philosophy.entoolment-is-the-pinnacle._.md`, `.the three costs a brain pays`

  ⇒ the repair **was** a sweep after all: `brain-turn` removed from ~10 files, replaced by the root
  cost stated directly. the prior entry's *"an addition, never a sweep"* is reversed

## .evidence

- **the overload carried weight, not cosmetics.** six sentences carried the contrast sense, and
  one carried both senses at once — *"a brief is not a lesser artifact than a tool, it is a tool at
  rung 1."* that sentence is only readable if the reader silently assigns a different sense to each
  occurrence
- **the ladder's five rungs are the invariant.** rung 0 🧠 tribal · 1 📚 brief · 2 💪💧 fluid skill ·
  3 💪🔩 rigid skill · 4 💪🪨 solid skill. rungs 2–4 and the glyphs are rhachet's determinism
  spectrum, adopted rather than coined. **`tool` spans all five; `skill` spans 2–4**

## .the boundary gap

`tool` composes `entool`, so it inherits the externalization family's one unsettled boundary:
`knowledge.` (what the artifact holds) vs `externalize.` (the act that produces it).

⚠️ **the family must be settled ONCE, for all of `enbrief` `enskill` `entool` `pave` `learn` `seed`
`tool` `skill`** — they share one ladder and one verb-shape, so a per-term guess would fracture a
family that is coherent today (`rule.require.boundary-qualified-terms`, `.the open gaps`).

⇒ left flat, with the gap on record. a guessed boundary is worse than an absent one.
