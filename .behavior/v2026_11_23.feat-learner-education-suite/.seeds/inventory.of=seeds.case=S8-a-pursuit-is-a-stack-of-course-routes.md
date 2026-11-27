# S8: a pursuit is a stack of course routes

## .said

> why would each stone have the idempotency term in there? why wouldnt it just be a route with subroutes

> a stack of routes

> where the first stone is to plot the courses

> and then the next stone is to go into them and complete each course

> e.g., each course gets its own

> such that education.course init runs within education.pursuit init

> and education.pursuit is the entrypoint

> and education.course failsfast if its not run from within an education.pursuit

> and then at the end of all the courses being done, the stone in pursuit reviews whether more courses are needed

> or whether we can graduate and stamp the pedigree

> more like dir as 2.courses.pursue.yield/* knawmean?

> and is it clear how the stack will move between the depths of routes?

> and that to end the course, you must eject back to the pursuit?

> exit, not eject

## .settled

- the pursuit is a parent route: `1.courses.plot` → `2.courses.pursue` → `3.courses.review` → `4.graduate`
- the review decides one of two: more courses (append to the plot, rewind `2.courses.pursue`), or graduate (stamp the pedigree)
- each course is its own child route under `2.courses.pursue.yield/course=$k.$slug/`: the pursue stone's yield is a dir, with the five course stones unsubstituted
- `education.pursuit init` is the only entrypoint; `education.course init` runs from within a pursuit, and fails fast (exit 2) anywhere else
- the bind swaps parent → course on `education.pursuit.course init` (push) and back on `education.pursuit.course exit` (pop); a course ends only by exit, via its last stone `4.exit`

## .landed

- `1.vision.yield.md` `.what this builds` + `.a pursuit is a stack of routes`
