# rule.forbid.domain-term-ambiguity

## .what

no domain term may carry more than one sense. one word, one concept. a term that is
**overloaded** — the same word used for two or more distinct concepts — is ambiguous, and an
ambiguous term in a contract is forbidden.

a **contract** is: a domain object / operation name, an internal contract (input/output shapes,
signatures), and above all the external interfaces we publish (api, sdk, cli).

## .why

- ambiguity is the twin hazard of the synonym: a synonym is many words for one concept; an
  overload is one word for many concepts. both break the shared vocabulary the glossary keeps.
- an overloaded term forces every reader to disambiguate by context — friction on every read.
- the overload hides an absent distinction: two concepts wear one name because the second was
  never granted its own word.

## .the test

ask: "does this word name exactly one concept, everywhere it appears?"

- one sense → adhere
- two or more senses → the word is overloaded; split the concepts, grant the second its own term

## .how

when you find, or are tempted toward, an overloaded term in a contract:

1. name the senses — enumerate the distinct concepts the one word carries
2. keep the word for its primary sense; coin a distinct term for each other sense
3. itemize the new term (rule.require.domain-term-itemization) and record the split

## .mantra

> one word, one sense — no term does double duty 📜

## .enforcement

a domain term overloaded across two or more distinct concepts in a contract = **blocker**
