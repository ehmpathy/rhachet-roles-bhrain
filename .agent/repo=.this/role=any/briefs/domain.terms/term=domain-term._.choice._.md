# domain.term: domain-term

term.chosen   = domain-term
term.kind     = noun
term.synonyms.forbidden:
- glossary-entry
- vocab-word
- lexeme

## .what
a **domain-term** is a word (a noun, verb, or adj) that composes a domain object or operation
declared in this repo. it is the unit this glossary itemizes — one `choice._.` cluster per
word, reused across every dobj/dop that word composes.

## .refs
where the term composes declared operations:
- src/domain.operations/learn/genDomainTermsScaffold.ts     # gen the domain.terms scaffold
- src/domain.operations/learn/getDomainTermsPaths.ts        # the domain.terms paths
- src/domain.operations/learn/getDomainTermsReadmeContent.ts
- .agent/repo=.this/role=any/briefs/domain.terms/            # the glossary the terms live in

## .reason
see the ref-level cluster beside this choice:
- `term=domain-term._.choice.reason.md` — etymology + why a term is the word, not the dobj/dop
