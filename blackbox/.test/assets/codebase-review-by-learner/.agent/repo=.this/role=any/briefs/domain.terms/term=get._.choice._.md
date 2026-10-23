# domain.term: get

term.chosen   = get
term.kind     = verb
term.boundary = repo
term.synonyms.forbidden:
- fetch
- find
- lookup
- calculate

## .what
return a value, with no side effect. one sense: the caller learns from the name alone that the
call changes naught. whether the value is stored or computed is the operation's own detail, never
a second sense of the verb.

## .refs
- src/clean.terms.ts — `getLessonPrice`

## .reason
- `term=get._.choice.reason.md`
