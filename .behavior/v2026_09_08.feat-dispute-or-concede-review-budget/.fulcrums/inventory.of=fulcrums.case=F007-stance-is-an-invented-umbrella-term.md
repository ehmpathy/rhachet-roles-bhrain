# F07 · `stance` is an invented umbrella over dispute + concede

- **rework** = clean · **confidence** = 70% · **status** = best-guessed

## .the fork

the gate must say *"you owe one of two things"*. that sentence needs a word for **the genus**.

| candidate | verdict |
|---|---|
| `verdict` | ❌ taken — `ReviewPeerVerdict` is the **reviewer's** output |
| `stance` | ✅ unused in `src/` (grep: 0 hits) |
| `response` | ❌ too wide; a `.taken` is also a response |
| `signal` | ❌ too wide; every `--as` is a signal |
| no umbrella | the gate says *"dispute or concede"* everywhere, spelled out |

## .taken, and why

**`stance`.**

`rule.require.enumerate-before-you-name` demands the instances be listed before the word is picked.
they are exactly two — `disputed`, `conceded` — and the test is whether the candidate covers both
**and excludes the neighbours**:

| | covers dispute? | covers concede? | excludes the reviewer's verdict? |
|---|---|---|---|
| `verdict` | ✅ | ✅ | ❌ **overloads** the reviewer's word |
| `response` | ✅ | ✅ | ❌ a `.taken` is one too |
| `stance` | ✅ | ✅ | ✅ |

⇒ **`stance` is the only candidate that clears the third column**, which is the one
`rule.forbid.domain-term-ambiguity` grades.

**boundary** = `route.guard.review` — the answer to *"stance, of WHAT?"* in one word, per
`rule.require.boundary-qualified-terms`. so the cluster is
`term=route.guard.review.absorption._.choice._.md`.

## .rework, and why

**clean.** an umbrella term appears in prose, in the halt copy, and in one type alias. a rename is a
`sedreplace`. the two **member** words are the wisher's and do not move.

## .confidence, and why it is 70%

low, and for a stated reason: **the wisher coined `dispute` and `concede` and coined no genus.** a
term invented to fill a slot nobody asked for is exactly the class
`rule.always.itemize-the-fulcrums…` flags — *"you invent a taxonomy, an axis set, or a state machine
no one named."*

⚠️ **the no-umbrella option is genuinely viable.** the gate can read *"declare: dispute or concede"*
and never need a genus. the cost is that every rule, every emit, and every type must spell both,
and the pair then has no name to be reasoned about as a pair.

⇒ **what would settle it:** a second reader who has to write the halt copy. if they reach for a word
and find none, the term is earned.

## .where

`1.vision.yield.md` § *the terms* · the halt copy in `case=2`

## .the verdict

🔴 **wisher-ruled 2026-09-15 — REVERSED. the umbrella is `absorb`, and `stance` is forbidden.** the
wisher settled a better word than the invented `stance`: the driver **absorbs** each concern. the
verb is `setStoneAsAbsorbed`; the recorded disposition is an **`absorption`** of kind `disputed` or
`conceded`. `stance` becomes a forbidden synonym.

⇒ the coinage held (an umbrella WAS earned — the no-umbrella option is retired), but the WORD moved:
`stance` → `absorb`/`absorption`. recorded at `S20`, and the term cluster's supersession is marked in
`term=route.guard.review.absorption._.choice._.md` (renames to `...absorption.*` when the code rename
lands). ⇒ see also `F038` — the composition verdict that `absorb` also subsumes `contemplate`.
