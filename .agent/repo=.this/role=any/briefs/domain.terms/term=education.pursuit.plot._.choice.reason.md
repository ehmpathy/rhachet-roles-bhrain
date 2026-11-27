# domain.term.reason: education.pursuit.plot

## .etymology

to plot a course is to chart a route before the voyage; a plot is that chart. the pursuit sets
out an aim, then plots the courses that reach it, each on the briefs of the last.

the word reads both ways the suite needs: the stone is the act (`1.courses.plot`), its yield is
the noun (the plot).

rejected:
- `syllabus` — the content of one course, not the order across courses
- `curriculum` — a fixed program set by an institution; a plot is the student's own, and grows
  when `3.courses.review` appends a course
- `roadmap` — a product word; it names dates and releases, not prerequisites
- `schedule` — names times; a plot names order and dependence, never a date

## .evidence

- the plot is read by three readers, each by column name: the plot order (`initCourseRoute`),
  the pursue judge (`getOneEducationJudgeVerdict`), the pedigree (`getOneCourseProof`)
- a course the plot never names is refused, so the pedigree cites only plotted courses
- `3.courses.review` may append to the plot; the plot is the one record of that growth

## .invariants

- a plot table has a `course` column; its rows name course slugs in order
- a new course must be the next plotted course not yet exited
- `2.courses.pursue` passes only when every plotted course has exited
