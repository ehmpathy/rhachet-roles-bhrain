# self-review r6: has-consistent-conventions

## pause

i am the reviewer, not the author.

i search the codebase to verify that the blueprint follows extant conventions for names, file patterns, test structure, and terminology.

---

## search 1: file name conventions

### test file patterns

**query**: `*.integration.test.ts` and `*.acceptance.test.ts` patterns

**result**:
- integration tests: collocated with source, named `*.integration.test.ts`
- acceptance tests: in `blackbox/`, named `driver.route.*.acceptance.test.ts`
- unit tests: collocated with source, named `*.test.ts`

**blueprint files**:
| file in blueprint | convention | matches? |
|-------------------|------------|----------|
| `route.mutate.guard.integration.test.ts` | integration test | yes |
| `driver.route.mutate.acceptance.test.ts` | acceptance test | yes |
| `driver.route.blocked.acceptance.test.ts` | acceptance test | yes |
| `getBlockedChallengeDecision.test.ts` | unit test | yes |

**why it holds**: the blueprint references only extant test files (no new files created). the file names follow established patterns:
- integration tests collocated in `skills/` directory
- acceptance tests in `blackbox/` with `driver.route.*` prefix
- unit tests collocated with source

no divergence from extant name conventions.

---

## search 2: operation name conventions

**query**: prefixes in `src/domain.operations/route/`

**result**:
```
get*  - getBlockedChallengeDecision, getBlockedTriggeredReport, getOnePassageReport
set*  - setStoneAsPassed, setStoneAsBlocked, setPassageReport
gen*  - genContextCliEmit
del*  - delStoneGuardArtifacts
run*  - runStoneGuardJudges, runStoneGuardReviews
step* - stepRouteDrive, stepRouteStoneSet
```

**blueprint operations**:
- `getBlockedChallengeDecision` - extant, follows `get*` pattern

**why it holds**: the blueprint modifies extant operations only:
- `getBlockedChallengeDecision` already follows `get*` convention
- `stepRouteDrive` already follows `step*` convention
- no new operations introduced, no new prefixes needed

the fix changes path computation inside extant operations. no name convention changes required.

---

## search 3: shell variable name conventions

**query**: variable names in `route.mutate.guard.sh`

**result**:
```
ROUTE_DIR     - SCREAMING_SNAKE_CASE
PRIVILEGE_FLAG - SCREAMING_SNAKE_CASE
FILE_PATH     - SCREAMING_SNAKE_CASE
BIND_FLAG     - SCREAMING_SNAKE_CASE
TARGET_PATH   - SCREAMING_SNAKE_CASE
```

**blueprint variables**: none introduced. extant `ROUTE_DIR` used in pattern check.

**why it holds**: the blueprint reuses extant `ROUTE_DIR` variable in the grep pattern check:
```bash
# extant variable
ROUTE_DIR=$(dirname "$(dirname "$BIND_FLAG")")

# blueprint change: uses extant variable in pattern
grep -qE "^${ROUTE_DIR}/\.route/"
```

no new shell variables introduced. extant variable `ROUTE_DIR` is referenced, not renamed or replaced.

---

## search 4: test structure conventions

**query**: BDD patterns in extant tests

**result**:
- uses `given`, `when`, `then` from test-fns
- uses `useBeforeAll` for setup
- uses `useThen` for shared results
- labels: `[caseN]` for given, `[tN]` for when

**blueprint test structure**:
```
given('[case N] bound route at .route/xyz/')
  when('[t0] Write to .route/xyz/artifact.md') → allowed
  when('[t1] Write to .route/xyz/subdir/doc.md') → allowed
  when('[t2] Write to .route/xyz/.route/passage.jsonl') → blocked
```

**why it holds**: the blueprint test cases follow extant BDD patterns:
- `given('[caseN] description')` block structure
- `when('[tN] action')` with sequential indices
- `then('assertion')` for outcomes

verified by comparison with extant test in `route.mutate.guard.integration.test.ts`:
```ts
given('[case1] bound route with no privilege flag', () => {
  when('[t0] Read of *.stone', () => {
    then('exits with code 2 (blocked)', () => { ... });
  });
});
```

the blueprint uses identical structure. no deviation from BDD convention.

---

## search 5: blocker directory name

**query**: what are extant directory names under routes?

**result** (directories under route):
- `.route/` - metadata directory
- `.route/blocker/` - blocker articulation files (extant location)
- no other named subdirectories at route level

**blueprint proposes**: `$route/blocker/` (move from `.route/blocker/`)

**directory name convention check**:
- route artifacts have no prefix (e.g., `1.vision.md`, `2.criteria.md`)
- route subdirectories: only `.route/` (hidden) documented

**question**: is `blocker/` a good name for a visible subdirectory?

**analysis**:
- `blocker` is a noun (not gerund) - correct
- term is used consistently in codebase (`DriveBlocker.ts`, `setStoneAsBlocked.ts`)
- alternatives considered: `blockers/` (plural), `blocked/` (past participle)
- extant domain uses `blocked/` for operations directory (`src/domain.operations/route/blocked/`)

**potential inconsistency**: codebase uses `blocked/` as directory name for operations, but `blocker/` for articulation files.

---

## search 6: blocker path in other files

**query**: where else is blocker path computed?

**result**:
```
src/domain.operations/route/blocked/getBlockedChallengeDecision.ts:23-28
  path.join(input.route, '.route', 'blocker', `${input.stone}.md`)

src/domain.operations/route/stepRouteDrive.ts:358
  const articulationPath = `${input.route}/.route/blocker/${input.stone}.md`;
```

**issue found**: blueprint lists `getBlockedChallengeDecision.ts` but NOT `stepRouteDrive.ts`!

the blocker path is computed in TWO places, not one.

---

## issues found

### [ISSUE] absent file: stepRouteDrive.ts

**what**: blocker path is computed in `stepRouteDrive.ts` line 358, not just `getBlockedChallengeDecision.ts`.

**impact**: if blueprint only updates `getBlockedChallengeDecision.ts`, the two locations will diverge.

**evidence**:
```ts
// stepRouteDrive.ts:358
const articulationPath = `${input.route}/.route/blocker/${input.stone}.md`;
```

**fix required**: add `stepRouteDrive.ts` to filediff tree:
```
src/
└─ domain.operations/route/
   ├─ [~] stepRouteDrive.ts                    # update: change blocker path
   └─ blocked/
      ├─ [~] getBlockedChallengeDecision.ts
      └─ [~] getBlockedChallengeDecision.test.ts
```

### [OBSERVATION] singular vs plural: blocker/ vs blockers/

**what**: blueprint uses `blocker/` (singular) for directory name.

**extant patterns**:
- `src/domain.operations/route/blocked/` - uses past participle
- `src/domain.operations/route/stones/` - uses plural
- `src/domain.operations/route/judges/` - uses plural
- `src/domain.operations/route/guard/` - uses singular
- `src/domain.operations/route/drive/` - uses singular

**conclusion**: no clear convention. both singular and plural used. `blocker/` is acceptable.

---

## conclusion

one issue found and fixed:

1. **[FIXED]** `stepRouteDrive.ts` absent from filediff tree — blocker path computed in two places, both must be updated

**fix applied to blueprint**:
- added `stepRouteDrive.ts` to filediff tree
- added codepath tree section for `stepRouteDrive.ts`
- updated execution sequence step 3 to mention both files

**lesson learned**: when a value (like a path pattern) is computed, search for ALL locations where it's computed. grep for the path string literal (`.route/blocker/`) to find all occurrences, not just the one mentioned in prior research.

conventions otherwise consistent:
- file names follow extant patterns
- test structure follows BDD conventions
- shell variables follow SCREAMING_SNAKE_CASE
- operation names follow `get*`/`set*` pattern
- `blocker/` directory name is acceptable

