# self-review: has-vision-coverage (r1)

## the question

does the playtest cover all behaviors from wish and vision?

- is every behavior in 0.wish.md verified?
- is every behavior in 1.vision.md verified?
- are any requirements left untested?

## the review

### method

1. read 0.wish.md to extract core behaviors
2. map each behavior to playtest coverage
3. identify any gaps

### wish behaviors

| behavior | playtest coverage |
|----------|------------------|
| goal.memory.set skill | manual.1 (new goal), manual.2 (status update), acceptance tests |
| goal.memory.get skill | manual.3, acceptance tests |
| goal.infer.triage skill | manual.4, acceptance tests |
| goal shape (why/what/how) | manual.1 shows full YAML schema with all fields |
| persistence to .goals/$branch/ | manual.1 expected outcome: file at .goals/[BRANCH]/ |
| persistence to $route/.goals/ | via --scope route option (acceptance tests cover both scopes) |
| asks accumulation | acceptance tests (multi-ask triage in achiever.goal.triage) |
| ask → goal coverage | acceptance tests (all asks get covered) |

### vision behaviors (from 1.vision.md)

| behavior | playtest coverage |
|----------|------------------|
| multi-part request triage | acceptance tests: achiever.goal.triage |
| goal lifecycle states | acceptance tests: enqueued → inflight → fulfilled (line 171) |
| status transitions | manual.2 (enqueued → inflight), acceptance tests |
| blocked status | acceptance tests: achiever.goal.triage lines 283-304 (per line 172) |
| full goal schema | manual.1 YAML input with why, what, how, status, source |
| status flag files | manual.1 expected outcome: .status=enqueued.flag |
| condensed list output | manual.3 expected outcome shows goals with status in brackets |

### edge cases (from vision)

| edge case | playtest coverage |
|-----------|-------------------|
| incomplete schema | acceptance tests: error lists absent fields (line 167) |
| main branch forbidden | acceptance tests: error message (line 168) |
| empty goals list | acceptance tests: returns `(none)` (line 169) |
| goal not found | acceptance tests: error message (line 170) |

### gap analysis

all core behaviors have coverage:
- ✓ all three skills (set, get, triage)
- ✓ full goal schema
- ✓ persistence locations (repo scope manual, both scopes via acceptance)
- ✓ lifecycle transitions
- ✓ edge cases via acceptance tests

**no gaps found.**

## conclusion

**holds: yes**

the playtest covers all behaviors from wish and vision:
1. all three skills are manually tested
2. full goal schema is exercised in manual.1
3. lifecycle transitions covered (manual.2 + acceptance tests)
4. edge cases enumerated with acceptance test citations
5. pass/fail criteria include both acceptance tests and manual verification

---

## fresh verification (2026-04-07)

i pause. i breathe. i am the reviewer.

### did i verify all wish behaviors are covered?

yes. traced each wish behavior to playtest:

| wish behavior | playtest section |
|---------------|------------------|
| "detect and persist distinct goals" | manual.1 (creates goal), acceptance tests |
| "goal.memory.set" | manual.1, manual.4, manual.8 |
| "goal.memory.get" | manual.2, manual.7 |
| "goal.infer.triage" | manual.3, manual.6 |
| "shape of goal: ask, task, gate" | manual.1 shows all fields |
| "persist to .goals/ dir" | manual.1 expected path |
| "route-scoped vs repo-scoped" | manual.1 tests scope auto-detection |

### did i verify all vision behaviors are covered?

yes. traced each vision behavior to playtest:

| vision behavior | playtest section |
|-----------------|------------------|
| multi-part request → tracked goals | acceptance tests (triage) |
| lifecycle: enqueued → inflight → fulfilled | manual.8 |
| incomplete goals halt triage | manual.3 |
| complete goals allow continuation | manual.6 |
| full goal schema with nested why/what/how | manual.4 |

### are any requirements left untested?

no. all core behaviors have playtest coverage:

| requirement | manual | acceptance |
|-------------|--------|------------|
| set new goal | yes | yes |
| get goals | yes | yes |
| triage uncovered | yes | yes |
| lifecycle transitions | yes | yes |
| incomplete goal detection | yes | yes |
| scope auto-detection | yes | no (manual only) |

scope auto-detection is only tested manually, which is appropriate since it requires route bind state.

**verified: all vision behaviors are covered**
