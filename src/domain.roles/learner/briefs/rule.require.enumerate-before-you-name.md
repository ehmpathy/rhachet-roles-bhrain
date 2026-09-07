# rule.require.enumerate-before-you-name

## .what

> **list every instance the word must cover. THEN pick the word.**

not the reverse. a word chosen against the one instance in front of you is a word that has been
tested exactly once, and a sample of one can neither confirm it nor refute it.

## .why — a single instance hides BOTH failure modes, and they are opposite

a name can be wrong in two directions, and **neither is visible from one example**:

| failure | what it looks like | why one instance cannot catch it |
|---|---|---|
| **too narrow** | the word fits the case you looked at, and breaks on a case you never listed | you never listed it |
| **too wide** | the word fits every case — so it discriminates none of them | with one case, "it fits" reads as success |

⇒ that symmetry is the whole argument. **too narrow** feels like precision and **too wide** feels
like generality, so both feel *right* at the moment of choice. only a list parts them: a narrow
word leaves a row uncovered, and a wide word covers every row identically.

## .the test — forced articulation, before the word

answer both, on the page, in this order:

> **1. "what are ALL the instances this word must cover?"**
>
> **2. "does the candidate word cover every one — and does it EXCLUDE its neighbours?"**

- a row it does not cover → **too narrow.** widen, or split into two words
- it covers every row **and** every adjacent concept too → **too wide.** it is the genus, and you
  need the differentia
- it covers every row and excludes the adjacent concepts → the word holds

🟡 **step 1 is the one that gets skipped**, because the instance in hand feels like the category.
it is not; it is one member of it.

## .the worked case — `degenerate` vs `specialized`

rung 3 of the entoolment ladder holds several shapes beside a route. the question was what to call
their relation to it.

**the candidate was `degenerate`** — a real term of art, and it fit the first instance perfectly.
then the instances were listed:

| the rung-3 shape | is it `degenerate`? | is it a `specialization`? |
|---|---|---|
| a skill that computes its setup, then hands one probabilistic step to a brain | ✅ yes — a route reduced to **one stone** | ✅ yes |
| a wrapper that batches the deterministic half | 🔴 **no** — an all-deterministic route is complete, not reduced | ✅ yes |

⇒ **`degenerate` broke on the wrapper**, and that shape was invisible until it was written down.
`specialized` covers both, so it is the word.

**the enumeration took one table.** the wrong word would have shipped in a published brief and
been cited from three others.

## .the peer cases — the same test, the opposite failure

three more from this repo, all **too wide** rather than too narrow:

| the word | the instances | what the list showed |
|---|---|---|
| `knowledge`, as the word a **brief** is contrasted against | what a brief holds · what a skill holds | it covers **both** — a skill carries knowledge too. it is the genus; `concepts` / `capacity` are the differentia |
| `tool`, as the word a **brief** is contrasted against | a brief · a fluid skill · a rigid skill · a solid skill | it covers **all four**, so it cannot also name a proper subset of them. `skill` is the contrast word; `tool` is the umbrella |
| `rung`, unqualified | a gate-position on a review ladder · a determinism position on the entoolment ladder | **one word, two senses.** the flat namespace has one slot and the list needs two |

⇒ in every one, the list is what made the defect visible, and in every one the word **read fine**
against whichever instance was in hand.

## .the cues — when → then

| when… | then… |
|---|---|
| you are about to name a **relation** between two concepts | 🔴 list every pair the word must hold over, first |
| a word fits the example you have in view | that is a sample of one. what is the second example? |
| you reach for a **term of art** because it is precise | precision is what makes it narrow. check the rows it excludes |
| a candidate covers every instance you listed | 🔴 check the **adjacent concepts** too — a word that covers them all is the genus |
| you cannot list a second instance | the concept may not be general enough to earn a word yet |

## .the relation to the glossary rules

this is the move that **precedes** the two glossary rules, never a rival to them:

- `rule.forbid.domain-term-synonyms` asks *"one concept or two?"* — which is the enumeration,
  applied to senses rather than instances
- `rule.require.boundary-qualified-terms` catches the `rung` case **after** two senses exist

⇒ so this rule is where both are cheapest to satisfy: **at authorship, with a table, before a
citation exists.** the same asymmetry the whole practice runs on — one table now, a rename plus
every citation later.

## .enforcement

- a term proposed with **one** instance cited = **blocker** — a sample of one cannot be checked
- a term whose enumeration shows an uncovered row = **blocker** — too narrow
- a term that covers every row **and** its adjacent concepts = **blocker** — it is the genus; name
  the differentia
- a term whose concept genuinely has one instance = **not a violation** — say so, and say why a
  second is not available

## .see also

- `rule.forbid.domain-term-synonyms` — the one-concept-or-two test, which this front-loads
- `rule.require.boundary-qualified-terms` — what to do once the list shows two senses of one word
- `rule.require.domain-discovery-for-term-proposals` (architect) — the discovery this is one move
  within; a dimensional walk is an enumeration over axes rather than instances
- `philosophy.entoolment-is-the-pinnacle.concepts-vs-capacity` — the `knowledge` case, in full
- `rule.always.reuse-pavement-before-improvise` — check whether the repo already named it, before
  you enumerate at all
