# domain.term: education.pursuit.course.vitro

term.chosen   = vitro
term.kind     = adj
term.boundary = education.pursuit.course   # "vitro, of what?" → a stage of a course
term.synonyms.forbidden:
- sandbox
- lab
- playground
- scratch

## .what

**vitro** is the course stage where each claim read from the greats is tested in isolation,
before the role's live work: stone `3.practice.vitro`. each claim earns a verdict — held,
refuted, or untested — with the evidence beside it. its pair is `vivo`: the live task the
assess stage measures.

## .refs

- src/domain.operations/education/course/templates/3.practice.vitro.stone
- src/domain.operations/education/getOneCourseRecord.ts   # reads the `claim | verdict` table
- `term=doc.kernel.claim._.choice._.md`   # what vitro tests

## .reason

- `term=education.pursuit.course.vitro._.choice.reason.md`
