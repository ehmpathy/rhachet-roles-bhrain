# domain.term: education.pursuit.course.proof

term.chosen   = proof
term.kind     = noun
term.boundary = education.pursuit.course   # "proof, of what?" → of a course
term.synonyms.forbidden:
- record
- result
- report
- summary

## .what

a course's **proof** is what the course proved, read from its fixed-shape yields: the outcome
score before and after, the transfer task, the greats read, each claim with its verdict, and each
brief and skill it wrote.

the pedigree entry cites each course by its proof: a tallied row in the summary table, then its
claims and yields in full.

## .refs

- src/domain.operations/education/getOneCourseProof.ts
- src/domain.operations/education/asPedigreeCourse.ts
- src/domain.operations/education/asPedigreeEntryMarkdown.ts

## .reason

- `term=education.pursuit.course.proof._.choice.reason.md`
