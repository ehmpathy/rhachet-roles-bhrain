# domain.term: education.pursuit.course.exit

term.chosen   = exit
term.kind     = verb
term.boundary = education.pursuit.course   # "exit, of what?" → of a course
term.synonyms.forbidden:
- eject
- pop
- leave
- finish

## .what

to **exit** a course is to end it and return the branch bind to its pursuit. exit is the only
end a course has: it refuses while any stone before `6.exit` is unpassed, then records the exit
yield, marks `6.exit` passed, and swaps the bind back.

`init` and `exit` are the pair: init pushes into a course, exit pops out of it.

## .refs

- src/domain.operations/education/exitCourseRoute.ts
- src/domain.operations/education/STONE_OF_EXIT.ts
- src/domain.operations/education/course/templates/6.exit.stone

## .reason

- `term=education.pursuit.course.exit._.choice.reason.md`
