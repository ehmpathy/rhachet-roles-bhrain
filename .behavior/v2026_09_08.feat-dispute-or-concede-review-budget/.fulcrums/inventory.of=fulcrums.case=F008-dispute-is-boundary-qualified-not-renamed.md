# F08 · `dispute` is boundary-qualified, not renamed away from the glossary sense

- **rework** = clean · **confidence** = 85% · **status** = best-guessed

## .the fork

`dispute` is **already in use in this repo**, in a different sense:

> `howto.domain-term-disputes.[guide].md` — *"a **dispute** is how you challenge a term choice — a
> synonym you believe is right, or a word you believe names a genuinely distinct concept."*

so the wisher's word arrives onto an occupied slot. `rule.forbid.domain-term-ambiguity` grades an
overload in a contract a **blocker**, and a CLI flag is a contract.

| option | shape |
|---|---|
| **A** | rename the new sense — `--as objected` / `--as challenged` |
| **B** | rename the glossary sense — its disputes become `challenges` |
| **C** | **boundary-qualify both** — `glossary.dispute` and `route.guard.review.dispute` |

## .taken, and why

**option C.**

`rule.forbid.domain-term-ambiguity` states the repair rule outright, and it turns on one question:

| the senses differ by… | the repair |
|---|---|
| **concept** — two different things | **split** — coin a new term |
| **context** — one concept, two boundaries | **qualify** |

⇒ run its own test — *"$word, of WHAT?"*:

- a **glossary** dispute — a challenge to a settled choice, on record, that a later reader may rule on
- a **review** dispute — a challenge to a settled verdict, on record, that a later reader may rule on

🔴 **these are one concept at two boundaries, not two concepts.** the shape is identical: an actor
disagrees with a recorded judgment, files the disagreement rather than acts unilaterally, and a
council rules later. that is why option C is the sanctioned repair and A is not.

⚠️ **and the rule warns against the split explicitly:** *"a split where a boundary was owed coins a
synonym the glossary must then forbid."* to rename to `objected` would put a second word on one
concept — the very sprawl the glossary exists to prevent.

⇒ **the wisher's word is kept**, which is also what `rule.always.archive-the-wishers-words-verbatim`
would want of a coinage.

## .rework, and why

**clean.** the qualification lives in filenames and prose. the CLI flag is `--as disputed` under
either call; only the term cluster's name changes.

## .confidence, and why it is 85%

the rule's own sort settles it and the shapes really are congruent. the 15%: the congruence is my
read, and a reader who sees *"a term is a word, a verdict is a judgment"* may call them two concepts
and demand the split.

⇒ **what would settle it:** a learner's read of the two clusters side by side. this row is the
prompt for it.

## .the terms owed

`rule.require.domain-term-itemization` makes three clusters a blocker at the execution stone:

- `term=route.guard.review.dispute._.choice._.md` + `.reason.md`
- `term=route.guard.review.concede._.choice._.md` + `.reason.md`
- `term=route.guard.review.absorption._.choice._.md` + `.reason.md` (see F07)

the `.reason` for `dispute` carries this row as its evidence, and lists `objection`, `challenge`,
`refusal` as forbidden synonyms.

## .where

`1.vision.yield.md` § *the terms*

## .the verdict

_not yet ruled._
