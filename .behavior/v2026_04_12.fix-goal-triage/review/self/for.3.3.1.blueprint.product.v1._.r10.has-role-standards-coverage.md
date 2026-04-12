# self-review r10: has-role-standards-coverage

## approach

line-by-line review of blueprint against mechanic standards. for each section, question what patterns are absent. for each pattern, verify or note gap.

---

## blueprint section: filediff tree (lines 15-41)

### questioned: are all file changes typed correctly?

| file | change type | pattern check |
|------|-------------|---------------|
| goal.ts | [~] modify | correct - function rename + output changes |
| getTriageState.ts | [~] modify | correct - partition logic change |
| getAchieverRole.ts | [~] modify | correct - hook command update |
| goal.infer.triage.sh | [-] delete | correct - old skill removed |
| goal.triage.infer.sh | [+] create | correct - new skill added |

**question**: shell skill is created, not just renamed. does it need a new test?

**answer**: no. acceptance test invokes via `rhx` which resolves skill name. test update covers the rename.

### questioned: any file omitted from diff tree?

| check | status |
|-------|--------|
| domain operation file | present: getTriageState.ts |
| cli file | present: goal.ts |
| shell skill | present: both delete and create |
| role config | present: getAchieverRole.ts |
| tests | present: integration + acceptance |
| docs | present: readme.md, howto guide |
| boot config | present: boot.yml |
| hook file | present: userpromptsubmit.ontalk.sh |

**all files accounted for**: yes

---

## blueprint section: codepath tree (lines 45-115)

### questioned: does getTriageState.ts codepath show all changes?

| extant behavior | change | covered? |
|-----------------|--------|----------|
| partition by computeGoalCompleteness | change to status.choice | yes (lines 56-59) |
| return goalsComplete array | unchanged | yes (marked [○]) |
| return goalsIncomplete array | unchanged | yes (marked [○]) |

**question**: does the codepath show WHY status.choice is correct?

**answer**: vision explains this (status.choice is the goal lifecycle state, not field completeness). blueprint implements vision. codepath shows the change. adequate.

### questioned: does goal.ts codepath show all changes?

| change needed | covered in codepath? |
|---------------|---------------------|
| function rename | yes (line 65: renamed from goalInferTriage) |
| flag rename --mode → --when | yes (lines 67-68) |
| actionable command output | yes (lines 75-76, 84) |
| header update | yes (lines 73-74, 79-80) |
| triage required update | yes (lines 85-87) |

**all changes covered**: yes

### questioned: does goalTriageNext codepath show all changes?

| change needed | covered in codepath? |
|---------------|---------------------|
| remove generic hint | yes (lines 99, 103: [-]) |
| add per-goal tip | yes (lines 100, 104: [+]) |

**all changes covered**: yes

---

## blueprint section: test coverage (lines 119-163)

### questioned: are all unit test scenarios meaningful?

| scenario | why tested? |
|----------|-------------|
| status=incomplete, fields filled | verifies bug fix - was wrongly in complete |
| status=incomplete, fields absent | baseline case |
| status=enqueued | post-triage state should be complete |
| status=inflight | active work should be complete |
| status=blocked | blocked is past triage |
| status=fulfilled | done is past triage |
| mix | partition correctness |

**question**: is there redundancy?

**answer**: no. each status is a distinct enum value. tests each validates the filter predicate.

### questioned: are acceptance test scenarios meaningful?

| scenario | coverage purpose |
|----------|------------------|
| renamed skill | skill rename works |
| --when flag | flag rename works |
| actionable command output | new feature works |
| slug in command | dynamic slug insertion |
| field flags in command | correct flag format |
| status=incomplete with all fields | bug fix verified end-to-end |
| triage required message | footer update |

**question**: are there edge cases not covered?

| edge case | covered? | why/how |
|-----------|----------|---------|
| zero goals | implicit | empty array returns empty output |
| one goal | covered by any single-goal test |
| many goals | covered by tests with 2 goals |
| goal with all fields absent | covered by incomplete case |
| goal with some fields absent | covered - shows first absent field |

**edge cases adequate**: yes

### questioned: negative tests sufficient?

| negative case | what it verifies |
|---------------|------------------|
| --mode flag (old) | backward break is intentional |
| goal.infer.triage (old name) | skill not found |
| status=incomplete wrongly in complete | regression prevention |

**question**: should there be a negative test for malformed goal yaml?

**answer**: no. goal yaml parse is not changed by this blueprint. out of scope.

---

## blueprint section: implementation order (lines 167-179)

### questioned: is order correct for dependency?

| step | depends on | order correct? |
|------|------------|----------------|
| 1. getTriageState.ts | none | yes - foundation first |
| 2. integration test | getTriageState.ts | yes - test after impl |
| 3. goal.ts | getTriageState.ts | yes - uses it |
| 4. shell skill rename | goal.ts | yes - skill wraps cli |
| 5. getAchieverRole.ts | shell skill | yes - references skill |
| 6-9. docs/config | skill exists | yes - after skill created |
| 10-11. acceptance tests | all code | yes - tests last |

**order is dependency-correct**: yes

---

## mechanic standards check

### rule.require.input-context-pattern

**blueprint declares**: codepath shows getScopeDir, getTriageState as operations
**question**: do these follow (input, context)?
**verification**: getTriageState.ts extant code uses `(input: {...}, context?: {...})`
**verdict**: yes, extant pattern preserved

### rule.require.get-set-gen-verbs

**blueprint declares**: getTriageState
**question**: is `get` the correct verb?
**verification**: getTriageState retrieves state without mutation, correct for `get`
**verdict**: yes

### rule.require.exit-code-semantics

**blueprint declares**: hook mode exits 2 on constraint
**question**: is exit 2 correct for "incomplete goals"?
**verification**: exit 2 = constraint error = user must fix. incomplete goals require user to fill fields.
**verdict**: yes

### rule.require.given-when-then

**blueprint declares**: test table format
**question**: will tests use given/when/then?
**verification**: test table is spec. implementation will use test-fns.
**verdict**: yes (specification level)

### rule.forbid.gerunds

**blueprint text scan**:
- "partition" - noun/verb, not gerund
- "actionable" - adjective
- "renamed" - past participle
- "triage" - noun/verb

**gerunds found**: none
**verdict**: yes

### rule.require.ubiqlang

**terms used**:
- goalsComplete / goalsIncomplete - domain vocabulary
- status.choice - domain field
- computeGoalCompleteness - domain function

**question**: any term drift?

**answer**: no. terms match extant codebase.
**verdict**: yes

### rule.prefer.treestruct-output

**output format in blueprint**:
```
├─ incomplete goals
│  ├─ slug [status]
│  │  ├─ absent: fields
│  │  └─ to fix, run: ...
```

**verdict**: yes, treestruct format preserved

### rule.require.idempotent-procedures

**operations modified**: getTriageState, goalTriageInfer, goalTriageNext
**question**: are these idempotent?
**answer**: all read-only. no state mutation. idempotent by nature.
**verdict**: yes

### rule.require.blackbox (scope.acceptance)

**acceptance tests**: invoke via `rhx` shell command
**question**: do tests access internals?
**answer**: no. assert on stdout/stderr/exit code only.
**verdict**: yes

### rule.forbid.remote-boundaries (scope.unit)

**test file**: getTriageState.integration.test.ts
**question**: is `.integration.test.ts` correct?
**answer**: yes. reads filesystem (goal yaml files). remote boundary.
**verdict**: yes

---

## questioned: what could be absent?

### error handle?

**question**: does getTriageState need new error handle?
**answer**: no. filesystem errors are propagated. no new error modes introduced.

### validation?

**question**: does blueprint add new inputs that need validation?
**answer**: no. --when flag is parsed, but same as extant --mode. flag validation extant.

### types?

**question**: does blueprint require new types?
**answer**: no. uses extant Goal type. no new domain objects.

### documentation?

**question**: are docs updated?
**answer**: yes. blueprint includes readme.md, howto guide updates in filediff.

---

## summary

| check category | result |
|----------------|--------|
| filediff completeness | all files present |
| codepath completeness | all changes shown |
| test coverage | all scenarios meaningful |
| implementation order | dependency-correct |
| mechanic standards | 10/10 rules verified |
| absent patterns | 0 gaps found |

**conclusion**: blueprint covers all mechanic standards. no patterns absent. ready for execution.
