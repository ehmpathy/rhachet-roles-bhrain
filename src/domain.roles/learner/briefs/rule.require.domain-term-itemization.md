# rule.require.domain-term-itemization

## .what

every **domain term** — a **noun**, **verb**, or **adj** that composes this repo's declared
**domain objects** and **domain operations** — must be itemized into
`.agent/repo=.this/role=any/briefs/domain.terms/`.

one entry per word, **reused** across every object/operation that uses it: the noun `stone`
serves `Stone`, `getStone`, `genStone` alike; the verb `gen` serves every `gen*`. the declared
dobjs/dops are the **anchor** (they are what "born here" means); the **term is the word** they
are built from.

## .what counts

itemize a term when it is a word that composes a **declared** domain object or operation:

- a `DomainEntity` / `DomainLiteral` class name → its constituent nouns/adjs
- a `domain.operation` name → its verb + constituent nouns/adjs
  (e.g. `getStone` → verb `get` + noun `stone`)

## .what does NOT count

- generic english not part of the domain vocabulary (`file`, `run`, `data`)
- vocab **imported** from a `package.json` dependency (`DomainEntity`, `IsoPriceWords`, `Role`
  are the tool's terms, not this domain's)
- a plain local variable that is not a domain concept

## .why

- code that speaks one canonical vocabulary is legible to every traveler, human or robot
- a term discovered but not itemized is a lesson lost — the next traveler re-derives it, or
  worse, invents a synonym
- the glossary compounds: each itemized word makes the next dobj/dop easier to name
- itemized early, the vocabulary composes; invented at the keyboard under deadline, it drifts

## .how

each term is a `choice._.` cluster under `domain.terms/`:

- `term=<x>._.choice._.md` — say-level (chosen word, kind, forbidden synonyms, refs, .what)
- `term=<x>._.choice.reason.md` — ref-level (etymology, disputes, evidence) — **required**
- `term=<x>._.choice.example=<abc>.md` — ref-level, one per notable example (optional)

see `template.domain-term.md` for the shape.

## .the test

ask: "is this word part of a domain object or operation this repo declares?"

yes → itemize it (once; reuse across all its declarations)
no → out of scope

## .mantra

> the words we build with deserve a glossary 📜

## .enforcement

a domain object or operation declared in this repo whose constituent terms are not itemized
into `domain.terms/` = **blocker**
