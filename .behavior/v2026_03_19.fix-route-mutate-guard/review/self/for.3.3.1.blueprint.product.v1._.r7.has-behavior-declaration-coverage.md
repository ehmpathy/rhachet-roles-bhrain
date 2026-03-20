# self-review r6: has-behavior-declaration-coverage

## pause

i am the reviewer, not the author.

i go through the vision and criteria line by line, then check each requirement against the blueprint.

---

## vision requirements

### vision.1: allow writes to bound route directory

**vision states**:
> ✅ Write to .route/v2026_03_19.declapract.upgrade/artifact.md → ALLOWED

**blueprint addresses**:
- summary #1: "allow artifact writes to the bound route directory itself"
- codepath: changes grep pattern from `\.route/` to `^$ROUTE_DIR/\.route/`
- tests: [t0] artifact write, [t1] subdirectory write

**covered**: yes

### vision.2: block writes to metadata subdirectory

**vision states**:
> ❌ Write to .route/v2026_03_19.declapract.upgrade/.route/passage.jsonl → BLOCKED

**blueprint addresses**:
- summary #2: "block writes to the `.route/` metadata subdirectory"
- codepath: pattern `^$ROUTE_DIR/\.route/` only matches metadata subdir
- tests: [t2] metadata write blocked

**covered**: yes

### vision.3: move blockers to visible location

**vision states**:
> **before**: blockers written to `$route/.route/blocker/*.md`
> **after**: blockers written to `$route/blocker/*.md`

**blueprint addresses**:
- summary #3: "move blocker articulation files from `$route/.route/blocker/` to `$route/blocker/`"
- codepath: `getBlockedChallengeDecision.ts` and `stepRouteDrive.ts` path changes
- tests: blocker path assertions in acceptance tests

**covered**: yes

### vision.4: backwards compatibility with .behavior/ routes

**vision states**:
> guard behavior unchanged — still works correctly

**blueprint addresses**:
- invariants: "routes at `.behavior/` continue to work identically (backwards compatible)"

**covered**: yes

---

## criteria usecases

### usecase.1: artifact writes to bound route

| criterion | blueprint coverage |
|-----------|-------------------|
| write to `.route/xyz/artifact.md` → allowed | [t0] integration test |
| write to `.route/xyz/subdir/artifact.md` → allowed | [t1] integration test |
| write to `.route/xyz/blocker/defect1.md` → allowed | acceptance test (blocker path) |

**covered**: yes — blocker write tested in acceptance layer per YAGNI decision (r3)

### usecase.2: metadata writes blocked

| criterion | blueprint coverage |
|-----------|-------------------|
| write to `.route/xyz/.route/passage.jsonl` → blocked | [t2] integration test |
| write to `.route/xyz/.route/.bind.branch.flag` → blocked | covered by same pattern |
| write to `.route/xyz/.route/other-metadata.txt` → blocked | covered by same pattern |

**covered**: yes — one test case covers the pattern `^$ROUTE_DIR/\.route/`

### usecase.3: stone and guard protection unchanged

| criterion | blueprint coverage |
|-----------|-------------------|
| read `*.stone` → blocked | unchanged, not in scope of fix |
| read `*.guard` → blocked | unchanged, not in scope of fix |
| write `*.stone` → blocked | unchanged, not in scope of fix |

**covered**: yes — the fix does NOT touch stone/guard patterns:
```
├─ [○] check *.stone pattern → blocked
├─ [○] check *.guard pattern → blocked
```
the `[○]` marker indicates these are unchanged.

### usecase.4: behavior routes work identically

| criterion | blueprint coverage |
|-----------|-------------------|
| write artifact → allowed | invariants + extant tests |
| write metadata → blocked | invariants + extant tests |
| read stone → blocked | invariants + extant tests |

**covered**: yes — invariants section explicitly states backwards compatibility. extant tests in `route.mutate.guard.integration.test.ts` cover `.behavior/` routes.

### usecase.5: privilege grants bypass protection

| criterion | blueprint coverage |
|-----------|-------------------|
| privileged write to metadata → allowed | unchanged, not in scope |
| privileged read of stone → allowed | unchanged, not in scope |

**covered**: yes — the fix does NOT touch privilege logic:
```
├─ [○] check privilege
│  └─ exit 0 if privilege flag present
```
the `[○]` marker indicates this is unchanged.

### usecase.6: no bound route allows all

| criterion | blueprint coverage |
|-----------|-------------------|
| unbound branch → all operations allowed | unchanged, not in scope |

**covered**: yes — the fix does NOT change the "no bound route" path. guard exits early when no bind flag found. this is unchanged behavior.

### usecase.7: blocker location

| criterion | blueprint coverage |
|-----------|-------------------|
| blocker written to `$route/blocker/*.md` | codepath changes + tests |
| blocker NOT written to `$route/.route/blocker/*.md` | same fix addresses this |

**covered**: yes — both `getBlockedChallengeDecision.ts` and `stepRouteDrive.ts` updated.

---

## boundary conditions

| condition | blueprint coverage |
|-----------|-------------------|
| path within bound route, not in .route/ | [t0], [t1] tests |
| path within bound route, in .route/ | [t2] test |
| path is *.stone | unchanged, extant tests |
| path is *.guard | unchanged, extant tests |
| path outside bound route | out of scope (not checked by guard) |
| privilege granted | unchanged, extant tests |
| no route bound | unchanged, extant tests |

**all boundary conditions covered** — either by new tests or by unchanged behavior.

---

## gaps found

### none

all vision requirements addressed:
1. allow artifact writes — [t0], [t1]
2. block metadata writes — [t2]
3. move blockers — codepath + acceptance tests
4. backwards compat — invariants

all criteria usecases addressed:
1. artifact writes — tests
2. metadata blocked — tests
3. stone/guard unchanged — [○] markers
4. behavior routes unchanged — invariants
5. privilege unchanged — [○] markers
6. no bound route unchanged — [○] markers
7. blocker location — codepath + tests

---

## conclusion

the blueprint covers all requirements from the vision and criteria:

**why each usecase is covered**:
- usecases 1-2 (core fix): new tests added
- usecases 3, 5, 6 (unchanged behavior): marked as [○] in codepath, rely on extant tests
- usecase 4 (backwards compat): explicit invariant
- usecase 7 (blocker relocation): codepath changes + test updates

no gaps found. the blueprint is complete.

