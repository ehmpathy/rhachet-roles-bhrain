# self-review: role-standards-coverage

> review for coverage of mechanic role standards

---

## review method

walked through each changed source file and verified all relevant mechanic standards are applied:
- are there patterns that should be present but are absent?
- did the junior forget error handle, validation, tests, types, or other required practices?

### rule directories checked

enumerated briefs directories relevant to this code:

| directory | coverage check |
|-----------|----------------|
| `practices/code.test/` | integration tests, given-when-then, snapshots |
| `practices/code.prod/pitofsuccess.errors/` | error handle, fail-fast |
| `practices/code.prod/pitofsuccess.typedefs/` | type safety, no any |
| `practices/code.prod/evolvable.procedures/` | input validation |

---

## coverage checks

### test coverage

**rule.require.test-coverage-by-grain**:

| operation | grain | test type | test file | covered? |
|-----------|-------|-----------|-----------|----------|
| getGoalBlockerState | communicator | integration | getGoalBlockerState.integration.test.ts | yes |
| setGoalBlockerState | communicator | integration | setGoalBlockerState.integration.test.ts | yes |
| delGoalBlockerState | communicator | integration | delGoalBlockerState.integration.test.ts | yes |
| escalateMessageByCount | transformer | unit | goal.test.ts | yes |
| emitHelpOutput | transformer | unit | goal.test.ts | yes |
| emitSubBucket | transformer | unit | goal.test.ts | yes |
| KNOWN_FLAGS | constant | unit | goal.test.ts | yes |
| ALLOWED_YAML_KEYS | constant | unit | goal.test.ts | yes |

**rule.require.given-when-then** (test structure):
- getGoalBlockerState.integration.test.ts uses `given`/`when`/`then` from test-fns
- goal.test.ts uses `given`/`when`/`then` from test-fns

**rule.require.snapshots** (for user-face output):
- goal.test.ts line 64: `expect(output).toMatchSnapshot()`
- goal.test.ts line 84: `expect(output).toMatchSnapshot()`
- goal.test.ts line 123: `expect(output).toMatchSnapshot()`

**why it holds**: all new operations have integration tests. transformers have unit tests. outputs have snapshots.

---

### error handle coverage

**rule.require.fail-fast**:

| function | fail-fast check | lines |
|----------|-----------------|-------|
| collectUnknownFlags | early exit on unknown flags | 658-666 |
| validateStatusValue | exit 2 on invalid status | 444-454 |
| validateYamlKeys | exit 2 on unknown keys | 515-534 |
| validateYamlStatusChoice | exit 2 on invalid choice | 541-554 |
| assertScopeWhenBound | exit 2 if repo while bound | 618-634 |

**rule.require.exit-code-semantics**:
- all validation errors use exit(2) — constraint error
- all errors go to stderr via emitValidationError

**rule.forbid.failhide** (try/catch audit):

| location | try/catch | hidden error? | reason |
|----------|-----------|---------------|--------|
| getGoalBlockerState.ts:22-27 | catch | no | returns fresh state (documented) |
| delGoalBlockerState.ts:13-17 | catch | no | returns `{ cleared: false }` (explicit) |

**why it holds**: all validation errors fail-fast with exit 2. catch blocks have explicit return values, not hidden errors.

---

### type safety coverage

**rule.require.shapefit** (no as casts):

searched goal.ts for `as` keyword:

| location | usage | type safe? |
|----------|-------|------------|
| line 427 | `arg as (typeof KNOWN_FLAGS)[number]` | safe — literal type narrowed from string |
| line 445 | `status as GoalStatusChoice` | safe — after includes check |
| line 467 | `key as (typeof ALLOWED_YAML_KEYS)[number]` | safe — literal type narrowed |
| line 474 | `parsed.why as object` | safe — after typeof check |
| line 475 | `key as (typeof ALLOWED_WHY_KEYS)[number]` | safe — literal type narrowed |

**rule.forbid.any**:

searched for `any` in new files:

| file | any usage | count |
|------|-----------|-------|
| GoalBlocker.ts | none | 0 |
| getGoalBlockerState.ts | none | 0 |
| setGoalBlockerState.ts | none | 0 |
| delGoalBlockerState.ts | none | 0 |
| goal.ts (new functions) | none | 0 |

**why it holds**: `as` casts are all safe (after runtime check). no `any` types.

---

### input validation coverage

**rule.require.fail-fast** (all inputs validated):

| input | validation | where |
|-------|------------|-------|
| --scope value | checked against 'route' \| 'repo' | parseArgsForSet:685-689 |
| --status value | checked against GOAL_STATUS_CHOICES | validateStatusValue:444-454 |
| unknown flags | collected and rejected | collectUnknownFlags:422-438 |
| yaml top-level keys | checked against ALLOWED_YAML_KEYS | collectUnknownYamlKeys:466-470 |
| yaml why keys | checked against ALLOWED_WHY_KEYS | collectUnknownYamlKeys:473-479 |
| yaml what keys | checked against ALLOWED_WHAT_KEYS | collectUnknownYamlKeys:482-488 |
| yaml how keys | checked against ALLOWED_HOW_KEYS | collectUnknownYamlKeys:491-497 |
| yaml status keys | checked against ALLOWED_STATUS_KEYS | collectUnknownYamlKeys:500-506 |
| yaml status.choice | checked against GOAL_STATUS_CHOICES | validateYamlStatusChoice:541-554 |
| --scope repo while bound | assertScopeWhenBound fails | assertScopeWhenBound:618-634 |

**why it holds**: all user inputs are validated before use. unknown inputs rejected with helpful error.

---

## standards coverage check

| standard | files checked | coverage |
|----------|---------------|----------|
| rule.require.test-coverage-by-grain | 4 operations, 3 transformers | all covered |
| rule.require.given-when-then | all test files | yes |
| rule.require.snapshots | goal.test.ts | yes (3 snapshots) |
| rule.require.fail-fast | goal.ts (10+ validation points) | yes |
| rule.require.exit-code-semantics | goal.ts | yes (all exit 2) |
| rule.forbid.failhide | getGoalBlockerState, delGoalBlockerState | no hidden errors |
| rule.require.shapefit | goal.ts | yes (casts after checks) |
| rule.forbid.any | all new files | no any types |

---

## patterns that should be present

| pattern | present? | evidence |
|---------|----------|----------|
| integration tests for i/o operations | yes | 3 files in domain.operations/goal/ |
| unit tests for transformers | yes | goal.test.ts covers escalateMessageByCount, emitHelpOutput |
| snapshots for user output | yes | 3 snapshots in goal.test.ts |
| fail-fast validation | yes | 10+ validation points in goal.ts |
| exit code semantics | yes | all use exit 2 for constraint errors |
| helpful error messages | yes | emitValidationError shows allowed values |
| no hidden errors | yes | catch blocks have explicit returns |

---

## issues found and fixed

none found. all coverage standards are satisfied.

---

## conclusion

**all mechanic standards are covered.**

the implementation:
- has integration tests for all i/o operations (get/set/delGoalBlockerState)
- has unit tests for transformers (escalateMessageByCount, emitHelpOutput)
- has snapshots for user output (3 snapshots)
- validates all inputs before use (10+ validation points)
- uses exit code 2 for constraint errors
- shows helpful error messages with allowed values
- has no hidden errors (catch blocks have explicit returns)
- has no `any` types
- has safe `as` casts (all after runtime checks)

no absent patterns or omitted standards detected.
