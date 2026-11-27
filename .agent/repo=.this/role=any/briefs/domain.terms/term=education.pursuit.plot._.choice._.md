# domain.term: education.pursuit.plot

term.chosen   = plot
term.kind     = noun
term.boundary = education.pursuit   # "plot, of what?" → of a pursuit
term.synonyms.forbidden:
- syllabus
- curriculum
- roadmap
- schedule

## .what

a **plot** is a pursuit's ordered list of courses, each with the courses it builds on. it is the
yield of `1.courses.plot`: a table with a `course` column and a `builds on` column.

the plot governs the order. a new course opens only when it is the next plotted course not yet
exited; `2.courses.pursue` passes only once every plotted course has exited; the pedigree cites
each course's `builds on` from it.

## .refs

- src/domain.operations/education/pursuit/templates/1.courses.plot.stone
- src/domain.operations/education/getAllPlotRows.ts
- src/domain.operations/education/getAllPlottedCourses.ts

## .reason

- `term=education.pursuit.plot._.choice.reason.md`
