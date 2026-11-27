# domain.term: education.pursuit.course

term.chosen   = course
term.kind     = noun
term.boundary = education.pursuit   # "course, of what?" → of a pursuit
term.synonyms.forbidden:
- module
- class
- unit
- lesson

## .what

an **education.pursuit.course** is one bounded subject within a pursuit, read from an external
canon. it is a child route of ten stones at
`<pursuit>/2.courses.pursue.yield/course=$k.$slug/`: declare and baseline an outcome, read the
greats, practice in vitro, entool, assess, reflect, exit.

`education.pursuit.course init` pushes the branch bind into a course; `exit` pops it back.

## .refs

- src/domain.operations/education/initCourseRoute.ts · exitCourseRoute.ts · getAllCourseRoutes.ts
- src/domain.operations/education/course/templates/
- src/domain.roles/learner/briefs/define.education.pursuit.course.shape.md   # why ten stones

## .reason

- `term=education.pursuit.course._.choice.reason.md`
