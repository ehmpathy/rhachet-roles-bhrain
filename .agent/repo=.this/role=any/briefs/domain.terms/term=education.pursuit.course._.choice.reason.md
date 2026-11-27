# domain.term.reason: education.pursuit.course

## .etymology

latin `cursus`, a run: a course is one run through one subject, start to finish. it is the
word a domain expert (a teacher, a guild master) uses for the bounded unit a student takes.

rejected:
- `module`, `unit` — software and textbook words; they name a part, not a run with an end
- `class` — overloaded with the code construct
- `lesson` — overloaded: a document kind (`kno201.documents.lessons`); and a lesson is smaller
  than a course
- `route` — the mechanism a course rides on, not the domain unit it carries

## .evidence

- dimensional walk (subject breadth × bound × source): the cell one subject · bounded · external
  canon is the course; every other cell already has a word or is out of scope
- the ten-stone shape is cited to the course-design canon in
  `src/domain.roles/learner/briefs/define.education.pursuit.course.shape.md`
- full record: `.behavior/v2026_11_23.feat-learner-education-suite/1.vision.domain-discovery.md`

## .invariants

- a course runs only within a pursuit
- one course is open at a time within a pursuit; a nested course init is refused
- a course ends only by `exit`, once every stone before `6.exit` has passed
- an exited course is never pushed again
