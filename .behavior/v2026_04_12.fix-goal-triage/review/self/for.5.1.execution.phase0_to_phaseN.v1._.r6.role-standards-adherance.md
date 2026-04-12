# self review: role-standards-adherance (r6)

## review

checked code against mechanic role standards from briefs directories.

### relevant briefs directories

- `code.prod/evolvable.procedures/` - input/context pattern, arrow functions
- `code.prod/pitofsuccess.errors/` - exit code semantics, fail-fast
- `code.prod/readable.narrative/` - narrative flow, early returns
- `lang.terms/` - treestruct names, forbid gerunds
- `lang.tones/` - lowercase preference

### goal.ts adherance

| standard | check | status |
|----------|-------|--------|
| exit code semantics | exit 2 for constraint errors | adheres |
| treestruct output | uses `├─`, `└─`, `│` properly | adheres |
| lowercase in output | messages are lowercase | adheres |
| early returns | guard clauses in hook mode | adheres |
| narrative flow | flat structure, no nested if/else | adheres |

### getTriageState.ts adherance

| standard | check | status |
|----------|-------|--------|
| arrow functions | uses `const fn = () => {}` | adheres |
| input/context pattern | `(input: { scopeDir }, context?)` | adheres |
| single responsibility | one operation per file | adheres |
| what/why comments | header has `.what` and `.why` | adheres |

### shell skill (goal.triage.infer.sh) adherance

| standard | check | status |
|----------|-------|--------|
| fail-fast | `set -euo pipefail` | adheres |
| what/why header | has `.what` and `.why` | adheres |
| usage docs | usage section present | adheres |

### acceptance tests adherance

| standard | check | status |
|----------|-------|--------|
| given/when/then | uses test-fns pattern | adheres |
| useThen for shared results | shares result across assertions | adheres |
| case labels | `[case1]`, `[t0]` labels present | adheres |

### no issues found

all code follows mechanic role standards.

## outcome

full adherance to mechanic role standards confirmed.
