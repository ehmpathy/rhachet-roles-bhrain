# domain.term: education.pursuit.course.greats

term.chosen   = greats
term.kind     = noun
term.boundary = education.pursuit.course   # "greats, of what?" → of a course's subject
term.synonyms.forbidden:
- sources
- references
- experts
- authorities

## .what

the **greats** of a course are the masters of its subject and the works they wrote: the canon a
course reads. stone `2.1.greats.aim` names which greats to read and why; `2.2.greats.read` reads
them and harvests their kernels, each cited to the page.

## .refs

- src/domain.operations/education/course/templates/2.1.greats.aim.stone · 2.2.greats.read.stone
- src/domain.operations/education/getOneCourseRecord.ts   # reads the `great | work` table

## .reason

- `term=education.pursuit.course.greats._.choice.reason.md`
