# domain.term: glossary

term.chosen   = glossary
term.kind     = noun
term.synonyms.forbidden:
- dictionary

## .what
the repo's compiled list of its own domain terms — one canonical word per concept, for the
domain objects & operations declared in this repo. it is the dir this whole feature tends:
`.agent/repo=.this/role=any/briefs/domain.terms/`.

## .refs
where the term is declared / used:
- src/domain.operations/learn/getDomainTermsPaths.ts        # `glossaryDir`, `glossaryGitignorePath`
- src/domain.operations/learn/genDomainTermsScaffold.ts     # gen the glossary scaffold
- src/domain.operations/learn/getDomainTermsReadmeContent.ts # the glossary readme
- src/contract/cli/learn.ts                                 # "tend the glossary"
- .agent/repo=.this/role=any/briefs/domain.terms/.readme.md # the glossary's own readme

## .reason
see the ref-level cluster beside this choice:
- `term=glossary._.choice.reason.md` — etymology + the glossary-over-dictionary dispute
