# self review: role-standards-adherance (r7)

## deeper review

verified specific mechanic role standards line by line.

### rule directories checked

| directory | relevance |
|-----------|-----------|
| `code.prod/evolvable.procedures/` | function signatures, arrow functions |
| `code.prod/pitofsuccess.errors/` | exit codes, fail-fast |
| `code.prod/readable.narrative/` | code flow, early returns |
| `code.test/frames.behavior/` | test structure |
| `lang.terms/` | treestruct, no gerunds |

### goal.ts verification

**rule.require.exit-code-semantics**
- line 997: `process.exit(2)` for constraint errors (user must fix)
- verified: hook.onStop with issues = exit 2
- verified: all clear = silent return (exit 0)

**rule.require.arrow-only**
- line 944: `export const goalTriageInfer = async (): Promise<void> => {`
- all cli entrypoints use arrow functions

**rule.require.what-why-headers**
- lines 940-943: has `.what` and `.why` jsdoc
- verified for goalTriageInfer, goalTriageNext

**rule.require.narrative-flow**
- early return on line 1000 for success case
- no nested if/else, flat structure

### getTriageState.ts verification

**rule.require.single-responsibility**
- one operation: get triage state
- returns { asks, asksUncovered, goals, goalsComplete, goalsIncomplete, coverage }

**rule.require.what-why-headers**
- has `.what` and `.why` jsdoc at top

### invokeGoalSkill.ts verification

**rule.require.what-why-headers**
- line 56-62: has `.what` and `.why`

**test args handler**
- lines 85-90: `{ when: 'hook.onStop' }` → `['--when', 'hook.onStop']`
- verified correct conversion

### acceptance test verification

**rule.require.given-when-then**
- uses `given()`, `when()`, `then()` from test-fns
- labels: `[case1]`, `[t0]`, `[t1]` present

**rule.require.useThen-useWhen**
- useThen used for shared results (line 34, 73, etc.)
- avoids duplicate expensive operations

### no violations found

all code follows mechanic role standards.

## outcome

thorough line-by-line review complete. no issues found.
