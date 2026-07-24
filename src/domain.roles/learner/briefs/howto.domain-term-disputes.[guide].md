# howto.domain-term-disputes

## .what

a **dispute** is how you challenge a term choice — a synonym you believe is right, or a word you
believe names a genuinely distinct concept. rather than silently drift a contract to your
preferred word, you open a dated, resolvable entry in the term's `choice.reason.md` file.

## .why

- a synonym is not always wrong — sometimes it names a **distinct concept** the glossary has
  not yet split out
- a dispute turns a private disagreement into a durable, auditable record
- the next traveler sees the argument was had and settled — they do not re-litigate it
- "adhere or dispute" keeps the forbid a guide, not a scold: the escape valve is first-class

## .when to open a dispute

open a dispute when you find, or are tempted toward, a synonym in a contract and you believe:

- the synonym reads clearer or truer than the canonical term, **or**
- the word you reached for names a **different** concept that deserves its own term

if you simply used a synonym by habit, do not dispute — just adhere (rename to the canonical
term).

## .where the dispute lives

in the term's ref-level reason file: `term=<x>._.choice.reason.md`, under `## .disputes`. one
dated entry per dispute.

## .the shape of a dispute entry

```md
### dispute: <the-word>  —  raised <YYYY-MM-DD>  —  status: OPEN | RESOLVED (<outcome>)
- raised.by  = <traveler>
- claim      = <the case for the disputed word>
- counter    = <the case against it, or the case for the canonical term>
- resolution = <the settled outcome, once closed>
```

- **OPEN** while the argument is live; contracts keep the canonical term meanwhile
- **RESOLVED** once settled; the outcome names the word that prevailed and what becomes of the
  loser (usually: recorded as a forbidden synonym)

## .the worked example — `foamboard` ↔ `foamie`

a traveler feels "foamie" reads friendlier than "foamboard" for a beginner's foam surfboard —
it is what surfers actually say. they open:

```md
### dispute: foamie  —  raised 2026-07-23  —  status: RESOLVED (keep `foamboard`)
- raised.by  = <traveler>
- claim      = "foamie" is what surfers call a foam surfboard day to day — friendlier than
               the stiff "foamboard"
- counter    = the board-type set is `longboard`, `shortboard`, `foamboard` — one shape, read
               at a glance. "foamie" is informal slang that breaks that symmetry and blurs the
               board with a nickname; a contract reads clearer when the three sit in one form
               (rule.prefer.symmetric-term-pairs).
- resolution = keep `foamboard`; record `foamie` as a forbidden synonym. dispute closed.
```

the outcome: `foamie` lands in `term=foamboard._.choice._.md` under `term.synonyms.forbidden`,
and this entry preserves *why*.

## .the two outcomes

| outcome | what happens |
|---------|--------------|
| the canonical term holds | the disputed word becomes a forbidden synonym; entry marked RESOLVED |
| the disputed word prevails | either it replaces the canonical term, **or** it becomes a **new term** of its own (a distinct concept) — a fresh cluster, itemized per `rule.require.domain-term-itemization` |

## .mantra

> do not drift the word — dispute it, then let the record settle it 📜
