# review.self: has-consistent-conventions (r3)

## what was reviewed

name conventions and patterns in the changes versus extant codebase conventions.

## convention analysis

### test case names

**extant pattern**: `[case1]`, `[case2]`, ..., `[case6]` in acceptance tests

**new code**: `[case7]` for the new test case

**conclusion**: follows extant number convention.

### when block names

**extant pattern**: `[t0]`, `[t1]`, `[t2]` for temporal progression

**new code**: same pattern used in new test case

**conclusion**: consistent.

### variable names

**extant pattern**:
- `scene` for useBeforeAll fixture
- `tempDir` for temporary directory path
- `routeDir` for route directory path

**new code**: same variable names used

**conclusion**: consistent.

### directory names

**extant pattern**: `blocker/` directory name (concept matches domain)

**new code**: moved from `.route/blocker/` to `blocker/` - same name, different location

**conclusion**: consistent. the name `blocker/` matches the domain concept.

### guard message format

**extant pattern**: turtle emoji header, tree-style output with branches

**new code**: no changes to message format (snapshots capture same structure)

**conclusion**: consistent.

## no issues found

all name conventions and patterns align with extant codebase conventions.
