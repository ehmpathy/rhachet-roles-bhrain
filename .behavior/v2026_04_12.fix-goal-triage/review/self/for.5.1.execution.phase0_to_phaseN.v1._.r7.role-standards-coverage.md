# self review: role-standards-coverage (r7)

## review

checked if all relevant mechanic standards are applied where they should be.

### rule directories checked

| directory | relevance |
|-----------|-----------|
| `code.prod/pitofsuccess.errors/` | error codes, validation |
| `code.test/frames.behavior/` | test coverage |
| `code.test/scope.acceptance/` | blackbox tests |

### error validation coverage

**goal.ts parseArgsForTriage**
- lines 450-459: validates `--scope` with error if invalid
- lines 461-464: accepts `--when` (no validation needed, just sets mode)

why no `--when` validation?
- function defaults to `'triage'` mode if not provided
- the value is only used for conditional branch logic
- no user error needed

**goal.ts parseArgsForTriageNext**
- lines 1162-1167: validates `--when` with error if invalid
- throws BadRequestError if value is not 'hook.onStop'

### test coverage

**integration tests**
- getTriageState.integration.test.ts: 32 tests
- includes 6 status-based partition tests (new)

**acceptance tests**
- achiever.goal.triage.acceptance.test.ts: 124 tests
- achiever.goal.triage.next.acceptance.test.ts: 28 tests
- covers hook.onStop mode, incomplete goals, actionable output

### snapshot coverage

| output | has snapshot? |
|--------|---------------|
| goal.memory.set | yes |
| goal.memory.get | yes |
| goal.guard blocked | yes (fixed in r6) |
| goal.triage.infer triage mode | yes |
| goal.triage.next output | yes |

### what/why coverage

all exported functions have `.what` and `.why` jsdoc:
- goalMemorySet, goalMemoryGet
- goalTriageInfer, goalTriageNext, goalGuard

### no gaps found

all expected patterns are present.

## outcome

full coverage of mechanic role standards confirmed.
