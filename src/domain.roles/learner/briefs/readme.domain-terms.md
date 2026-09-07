# domain.terms 📜

a repo's **glossary** — one canonical word per concept, for the **domain objects & operations that
repo declares**.

it lives at `.agent/repo=.this/role=any/briefs/domain.terms/`. read it to learn what a repo calls
things, and why.

## .what lives there

one folder-mate cluster per term (one word). each cluster has:

- `term=<x>._.choice._.md` — the chosen word, its kind (noun/verb/adj), its forbidden synonyms, and
  where it is used
- `term=<x>._.choice.reason.md` — why this word: etymology, any settled disputes, and the evidence
  behind the choice
- `term=<x>._.choice.example=<abc>.md` — a notable example of the term in use (optional, one file
  per example)

start with `._.choice._.md` for the quick answer; open `.reason.md` when you want the full story.

## .the four rules

- `rule.require.domain-term-itemization` — every word that composes a declared domain object or
  operation gets a cluster
- `rule.require.boundary-qualified-terms` — a term carries its full boundary ancestry in its
  filename: *"$word, of WHAT?"*
- `rule.forbid.domain-term-synonyms` — contracts use the canonical term; if you believe a synonym is
  right, open a dispute rather than drift silently
- `rule.forbid.domain-term-ambiguity` — one word, one concept. an overload hides an absent
  distinction

## .the gap census

a gap is a word a glossary owes and does not yet hold. it is recorded so the next traveler finds
it already named rather than re-derives it.

it lives in your own repo's `domain.terms/`, beside the terms it concerns — the gaps are that
repo's, so the record is too. an itemization, in the itemization form
(`rule.forbid.itemization-without-coordinates`):

```
domain.terms/inventory.of=gaps._.md   # the index — one row per gap, its state, its next move
domain.terms/gap=$word.md             # one file per gap that earned a full argument
```

🟡 **it is NOT this readme.** this file is generic and published, so a repo that wrote its gaps
here would ship its own backlog to every consumer.

🟡 **one row per gap, and no narrative about any one of them.** a gap that has earned a full
argument — an overload with measured evidence, a dispute with two sides — earns its own file beside
the term it concerns, and the row cites it by path.

## .who tends it

the learner keeps the glossary current — it captures a term the moment one is coined or debated. see
`im_an.obsessive_learner.for.domain.terms` for how, and `template.domain-term` for the cluster shape.

> a glossary's canonical word for itself is **glossary**, never "dictionary" — one concept, one word,
> itself first.

> the words we build with deserve a glossary. tend it, and raise the floor for all who come after. 📜
