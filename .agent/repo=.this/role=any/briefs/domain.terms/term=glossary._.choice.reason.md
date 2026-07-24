# domain.term.choice.reason: glossary

## .etymology
a **glossary** is a list of a domain's specialized terms with their meanings — precisely what
this dir is. chosen over `dictionary` (a general word-list of a whole language, broader than a
domain's own vocabulary) and `lexicon` (jargon-heavy, less plain). the code named it first:
`getDomainTermsPaths` returns `glossaryDir`, so the contract already spoke this word.

## .disputes
### dispute: dictionary  —  raised 2026-07-23  —  status: RESOLVED (keep `glossary`)
- raised.by  = human (wisher)
- claim      = the readme + several briefs called this dir "the repo's dictionary"; "dictionary"
               reads friendly and familiar
- counter    = one concept needs one word, and the code + paths already say `glossary`
               (`glossaryDir`). "dictionary" is a general-language word-list; a **glossary** is a
               domain's own term-list — the exact concept here. two words for one concept is the
               very drift this feature exists to stop, so the feature must obey its own
               `rule.forbid.domain-term-synonyms` — on its own name first.
- resolution = keep `glossary`; record `dictionary` as a forbidden synonym. every contract
               (readme, cli output, briefs prose) moved to `glossary`. dispute closed.

## .evidence
- discovery: the wisher named the drift directly ("dictionary, or glossary?") — a domain expert
  who marks two words for one concept, the strongest signal a synonym must be settled
- this is the glossary's inaugural, self-referential entry: the first term the feature itemized
  is the word for the feature itself, and its first dispute is over its own name
