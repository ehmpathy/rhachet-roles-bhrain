# S06 — `SOME` everywhere is fine, to cut test duration

kind: settles a question

## .said

> yeah SOME is fine to decrease duration of tests

## .settled

- the shared `REPEATABLY_CONFIG.criteria` is `'SOME'` in every environment; a real-brain test passes when
  one of its 3 attempts does
- the reason is duration: a slow host behind the tier made `EVERY` triple the run, and `SOME` stops at the
  first pass
- a reviewer that grades the loosened criteria a blocker is answered with this decision; fork C (scope
  `SOME` to the slow-tier suites) stays declined

## .landed

- `src/.test/infra/repeatably.ts`
- `.fulcrums/inventory.of=fulcrums.case=F6-repeatably-criteria-is-some-everywhere.md`
