# domain.term: learn

term.chosen   = learn
term.kind     = verb
term.boundary = externalize   # settled 2026-08-31; externalize is a ROOT (term=externalize._.choice.reason.md)
term.synonyms.forbidden:
- study
- train
- memorize

## .what
to **learn** is the learner role's core act: to durably retain a lesson so it is never
re-derived. the verb composes the role `learner` and its flagship operation `learn.domain.terms`
— the sweep that distills a round's domain terms into the glossary.

## .refs
where the term composes declared operations:
- src/contract/cli/learn.ts                              # learnDomainTerms — the cli operation
- src/domain.roles/learner/skills/learn.domain.terms.sh  # the skill that runs the operation
- src/domain.roles/learner/getLearnerRole.ts             # the onStop hook invokes learn.domain.terms
- src/domain.operations/learn/                           # the operation namespace born of this verb

## .reason
see the ref-level cluster beside this choice:
- `term=externalize.learn._.choice.reason.md` — etymology + why `learn`, not `study`/`memorize`
