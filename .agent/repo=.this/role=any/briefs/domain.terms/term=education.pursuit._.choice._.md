# domain.term: education.pursuit

term.chosen   = pursuit
term.kind     = noun
term.boundary = education   # "pursuit, of what?" → of an education
term.synonyms.forbidden:
- degree
- program
- curriculum
- learnership

## .what

an **education.pursuit** is the activity of one education: one role, one aim, and an ordered
stack of courses that each build on the last. it is a parent route
(`1.courses.plot` → `2.courses.pursue` → `3.courses.review` → `4.graduate`) at
`.route/v$date.education.pursuit.$role.$slug/`, opened only by `education.pursuit init`.

a pursuit that graduates becomes one `education.pedigree` entry.

## .refs

- src/domain.operations/education/initPursuitRoute.ts
- src/domain.operations/education/asPursuitRouteParts.ts · asPursuitRouteName.ts
- src/domain.operations/education/pursuit/templates/

## .reason

- `term=education.pursuit._.choice.reason.md`
