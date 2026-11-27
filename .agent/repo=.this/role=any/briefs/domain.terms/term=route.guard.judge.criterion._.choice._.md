# domain.term: route.guard.judge.criterion

term.chosen   = criterion
term.kind     = noun
term.boundary = route.guard.judge   # "criterion, of what?" → of a judge
term.synonyms.forbidden:
- check
- test
- rule
- condition

## .what

a **criterion** is the one fact a judge rules on. a judge that serves more than one stone takes
its criterion as input (`--criterion exited`) and prints the verdict for that fact alone.

the education judges hold five, one table in `getOneEducationJudgeVerdict`:

| criterion | stone | fact |
|---|---|---|
| `plot-valid` | `1.courses.plot` | the plot names sound, distinct, ordered courses |
| `courses-exited` | `2.courses.pursue` | every plotted course exited, none left open |
| `pedigree-stamped` | `4.graduate` | the entry, its index row, and its boot names hold; rendered for a linked role |
| `boot-within-budget` | `4.graduate` | the role still boots within the budget its spec declares |
| `exited` | course `6.exit` | every course stone passed, and the exit recorded |

## .refs

- src/domain.operations/education/getOneEducationJudgeVerdict.ts (`EducationJudgeCriterion`)
- src/contract/cli/education.pursuit.ts (`--criterion`)
- src/contract/cli/education.pursuit.course.ts (`--criterion`)

## .reason

- `term=route.guard.judge.criterion._.choice.reason.md`
