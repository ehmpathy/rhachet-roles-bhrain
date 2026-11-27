# domain.term.reason: route.guard.judge.criterion

## .etymology

a criterion is the standard a judgment is made against (greek *kritērion*, from *krinein*, to
judge). it shares its root with the judge itself, so the pair reads as one concept and its part:
a judge rules, on a criterion.

rejected:
- `check` — a forbidden synonym of `route.guard.judge` itself; to use it for the part would name
  the part and the whole with one word, an overload
- `test` — a test-code word; names a run, not the fact a run reads
- `rule` — names a brief directive in this repo (`rule.require.*`), a different concept
- `condition` — names a branch of code; reads as `if`, not as a standard a verdict meets

## .disputes

### dispute: check — raised 2026-11-26 — status: RESOLVED (canonical holds)
- raised.by  = the 5.1 repo-rules peer review, round 2
- claim      = `check` named the criterion in the contract (`EducationJudgeCheck`, `--check`)
- counter    = `check` is a forbidden synonym of `route.guard.judge`; the part needs its own word
- resolution = `criterion` names the part; `check` stays forbidden for both the judge and its
  criterion. contract renamed: `EducationJudgeCriterion`, `--criterion`, `CRITERIA_OF_PURSUIT`

## .evidence

- enumeration: the education judges rule on five facts (`plot-valid`, `courses-exited`,
  `pedigree-stamped`, `boot-within-budget`, `exited`); each is a fact a driver cannot fake by
  hand, and each has one verdict. no judge rules on two at once
- dimensional: one judge face × one criterion → one verdict. each criterion names the route kind
  it rules on; the pursuit face holds four, the course face one, both derived from one table
- one stone may hold two criteria (`4.graduate`: stamped, and within budget) as two judge lines;
  a criterion never fuses two facts
- the judge output contract (`passed:` / `reason:`) carries no criterion back: the caller named it

## .invariants

- a judge run names exactly one criterion
- a criterion a face does not hold is refused (exit 2), with the face's criteria named
- a criterion added to the union fails to compile until the judge table judges it
