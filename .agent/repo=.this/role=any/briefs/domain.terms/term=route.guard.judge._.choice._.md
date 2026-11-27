# domain.term: route.guard.judge

term.chosen   = judge
term.kind     = noun
term.boundary = route.guard   # "judge, of what?" → of a guard
term.synonyms.forbidden:
- check
- gate
- validator
- assertion

## .what

a **judge** is a command a guard runs to decide whether its stone may pass. it reads a fact of the
route and prints a verdict: `passed: true|false` and a `reason`. a guard lists its judges under
`judges:`; the stone passes only when every judge passes.

a judge differs from a reviewer: a reviewer grades an artifact and returns concerns; a judge
reads a fact and returns a verdict, with no concern to absorb.

the fact a judge rules on is its **criterion** (`term=route.guard.judge.criterion`).

## .refs

- src/domain.roles/driver/skills/route.stone.judge.sh
- src/domain.operations/education/getOneEducationJudgeVerdict.ts
- src/domain.operations/education/pursuit/templates/2.courses.pursue.guard
- src/domain.operations/education/course/templates/6.exit.guard

## .reason

- `term=route.guard.judge._.choice.reason.md`
