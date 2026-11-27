# domain.term.reason: education.pursuit.course.exit

## .etymology

a student exits a course: they leave the room the course is, and return to where they came
from. the word names both the end and the return, which is exactly what the bind swap does.

rejected:
- `eject` — names a forced removal; a course exit is the student's own completed act (settled by
  the wisher, seed S8)
- `pop` — the stack mechanism, not the domain act; it stays in code comments only
- `leave` — reads as abandonment; an exit here requires every prior stone passed
- `finish` — names the end without the return to the pursuit

## .evidence

- the pursuit is a stack of routes; a course must end by a return to the pursuit, never by a
  stall in the child (seed S8)
- the `init` / `exit` pair matches the push / pop the bind performs, one word per direction
  (`rule.prefer.symmetric-term-pairs`)

## .disputes

### dispute: eject — raised 2026-11-23 — status: RESOLVED (canonical holds)
- raised.by  = the driver, in the vision draft
- claim      = `eject` names the pop off the stack
- counter    = an exit is the course's completed end, not a forced removal
- resolution = `exit` holds; `eject` is a forbidden synonym

## .invariants

- exit refuses while any stone before `6.exit` is unpassed
- exit is the only writer of a `passed` passage for `6.exit`; a hand-written yield fakes no exit
