# self-review r8: has-behavior-declaration-adherance

## pause

i am the reviewer, not the author.

i go through the vision and criteria line by line, then check each against the blueprint for adherance. i look for drift, misinterpretation, or deviation from the spec.

---

## vision adherance

### vision outcome: allow writes to bound route directory

**vision states**:
> ✅ Write to .route/v2026_03_19.declapract.upgrade/artifact.md → ALLOWED

**blueprint addresses**:
- summary point #1: "allow artifact writes to the bound route directory itself"
- codepath: changes grep pattern from `\.route/` to `^$ROUTE_DIR/\.route/`

**why it holds**:

the vision describes a scenario where `$ROUTE_DIR = .route/v2026_03_19.declapract.upgrade`.

the OLD pattern `\.route/` would match ANY path with `.route/` in it, such as:
- `.route/xyz/artifact.md` — matches because of `.route/` at the start
- WRONG: this blocks artifact writes to routes located at `.route/`

the NEW pattern `^$ROUTE_DIR/\.route/` only matches paths that:
1. start with the exact route directory (`^.route/v2026_03_19.declapract.upgrade`)
2. followed by `/.route/` (the metadata subdirectory)

so `.route/v2026_03_19.declapract.upgrade/artifact.md` does NOT match because:
- it starts with `$ROUTE_DIR` ✓
- but it's followed by `/artifact.md`, not `/.route/`

**adherance**: yes — the pattern change allows artifact writes while it blocks metadata

### vision outcome: block writes to metadata subdirectory

**vision states**:
> ❌ Write to .route/v2026_03_19.declapract.upgrade/.route/passage.jsonl → BLOCKED

**blueprint addresses**:
- summary point #2: "block writes to the `.route/` metadata subdirectory within the route"
- codepath: pattern `^$ROUTE_DIR/\.route/` specifically matches the metadata subdir

**why it holds**:

the vision wants `.route/v2026_03_19.declapract.upgrade/.route/passage.jsonl` to be blocked.

let's trace through the pattern match:
- `$ROUTE_DIR` = `.route/v2026_03_19.declapract.upgrade`
- target path = `.route/v2026_03_19.declapract.upgrade/.route/passage.jsonl`
- pattern = `^$ROUTE_DIR/\.route/`
- expanded = `^.route/v2026_03_19.declapract.upgrade/\.route/`

the target path DOES match:
- starts with `.route/v2026_03_19.declapract.upgrade` ✓
- followed by `/.route/` ✓
- therefore blocked ✓

the pattern correctly identifies the metadata subdirectory while not blocking the route directory itself.

**adherance**: yes — the pattern blocks only metadata, not artifacts

### vision outcome: move blockers to visible location

**vision states**:
> **before**: blockers written to `$route/.route/blocker/*.md`
> **after**: blockers written to `$route/blocker/*.md`

**blueprint addresses**:
- summary point #3: "move blocker articulation files from `$route/.route/blocker/` to `$route/blocker/`"
- codepath changes in both `getBlockedChallengeDecision.ts` and `stepRouteDrive.ts`

**why it holds**:

the vision wants blockers to move from hidden (`.route/blocker/`) to visible (`blocker/`).

blueprint specifies the exact code changes:

```
getBlockedChallengeDecision.ts:
├─ before: path.join(input.route, '.route', 'blocker', `${input.stone}.md`)
└─ after: path.join(input.route, 'blocker', `${input.stone}.md`)

stepRouteDrive.ts:
├─ before: `${input.route}/.route/blocker/${input.stone}.md`
└─ after: `${input.route}/blocker/${input.stone}.md`
```

the `.route` segment is removed in both locations. the r6 review caught that stepRouteDrive.ts also computes this path (originally absent from blueprint) and was added.

**adherance**: yes — both blocker path locations updated per vision

### vision mental model

**vision states**:
> "oh! the guard protects the `.route/` subdirectory within a route, not routes that happen to be located AT `.route/`"

**blueprint aligns**:
- the grep pattern change encodes exactly this mental model
- `^$ROUTE_DIR/\.route/` means "starts with the route path, followed by /.route/"
- this distinguishes "route located at .route/" from "metadata in .route/ subdirectory"

**adherance**: yes — blueprint preserves the mental model from vision

---

## criteria adherance

### usecase.1: artifact writes to bound route

| criterion | blueprint satisfies? |
|-----------|---------------------|
| write to `.route/xyz/artifact.md` → allowed | yes — test [t0] |
| write to `.route/xyz/subdir/artifact.md` → allowed | yes — test [t1] |
| write to `.route/xyz/blocker/defect1.md` → allowed | yes — blocker path change |

**why it holds**:

the criteria has three sub-cases. the blueprint addresses each:

1. **artifact.md at route root**: test [t0] explicitly verifies this case. the pattern `^$ROUTE_DIR/\.route/` does NOT match `$ROUTE_DIR/artifact.md` because there's no `/.route/` segment.

2. **artifact.md in subdirectory**: test [t1] verifies `$ROUTE_DIR/subdir/doc.md`. the pattern still doesn't match because `subdir/` ≠ `.route/`.

3. **blocker files**: with the blocker path change, blockers write to `$route/blocker/*.md`. this path also doesn't match the metadata pattern because `blocker/` ≠ `.route/`.

**adherance**: yes — all three sub-cases have coverage

### usecase.2: metadata writes blocked

| criterion | blueprint satisfies? |
|-----------|---------------------|
| write to `.route/xyz/.route/passage.jsonl` → blocked | yes — test [t2] |
| write to `.route/xyz/.route/.bind.branch.flag` → blocked | yes — same pattern |
| write to `.route/xyz/.route/other-metadata.txt` → blocked | yes — same pattern |

**why it holds**:

the criteria specifies three files that should be blocked. all three share a common prefix: `$ROUTE_DIR/.route/`.

the blueprint's pattern `^$ROUTE_DIR/\.route/` is a PREFIX match. any path that starts with `$ROUTE_DIR/.route/` will be blocked:

- `$ROUTE_DIR/.route/passage.jsonl` — starts with prefix ✓ blocked
- `$ROUTE_DIR/.route/.bind.branch.flag` — starts with prefix ✓ blocked
- `$ROUTE_DIR/.route/other-metadata.txt` — starts with prefix ✓ blocked
- `$ROUTE_DIR/.route/nested/deep/file.txt` — starts with prefix ✓ blocked

one test case ([t2]) is sufficient to verify the pattern works. additional test cases would be redundant — they all exercise the same grep prefix match.

**adherance**: yes — pattern covers all `.route/` metadata

### usecase.3: stone and guard protection unchanged

| criterion | blueprint satisfies? |
|-----------|---------------------|
| read `*.stone` → blocked | yes — marked [○] unchanged |
| read `*.guard` → blocked | yes — marked [○] unchanged |
| write `*.stone` → blocked | yes — marked [○] unchanged |

**why it holds**:

the criteria requires that stone and guard protection remain unchanged. the blueprint uses `[○]` markers to explicitly show which codepaths are NOT modified:

```
└─ [~] evaluate protection
   ├─ [○] check *.stone pattern → blocked
   ├─ [○] check *.guard pattern → blocked
   └─ [~] check .route/** pattern
```

the `[○]` marker means "unchanged". the `[~]` marker means "modified".

the grep patterns for `.stone` and `.guard` are at lines 155 and 158 in the guard shell file. the blueprint only modifies lines 131, 141, and 161 — the `.route/` checks. the stone/guard checks are preserved.

**adherance**: yes — stone/guard patterns preserved by design

### usecase.4: behavior routes work identically

| criterion | blueprint satisfies? |
|-----------|---------------------|
| `.behavior/xyz/` routes unchanged | yes — invariants section |

**blueprint states**:
> "routes at `.behavior/` continue to work identically (backwards compatible)"

**why it holds**:

the criteria requires that `.behavior/` routes continue to work. let's trace through:

for a route at `.behavior/xyz/`:
- `$ROUTE_DIR` = `.behavior/xyz`
- pattern = `^$ROUTE_DIR/\.route/` = `^.behavior/xyz/\.route/`

artifact writes to `.behavior/xyz/artifact.md`:
- does NOT match pattern (no `/.route/` segment)
- allowed ✓

metadata writes to `.behavior/xyz/.route/passage.jsonl`:
- DOES match pattern (has `$ROUTE_DIR/.route/` prefix)
- blocked ✓

the fix changes the pattern from "any path with `.route/`" to "path starts with `$ROUTE_DIR/.route/`". this change works identically for routes at `.behavior/` as for routes at `.route/`.

**adherance**: yes — pattern works for both route locations

### usecase.5: privilege grants bypass protection

| criterion | blueprint satisfies? |
|-----------|---------------------|
| privileged operations allowed | yes — marked [○] unchanged |

**blueprint codepath**:
```
├─ [○] check privilege
│  └─ exit 0 if privilege flag present
```

**why it holds**:

the criteria requires that privilege grants bypass all protection. the blueprint preserves this via `[○]` marker.

the privilege check happens BEFORE the pattern checks:

```
guard hook invocation
├─ [○] parse stdin JSON
├─ [○] find bound route
├─ [○] check privilege
│  └─ exit 0 if privilege flag present    ← happens BEFORE pattern checks
└─ [~] evaluate protection
   ├─ [○] check *.stone pattern
   ├─ [○] check *.guard pattern
   └─ [~] check .route/** pattern         ← never reached if privileged
```

if privilege is granted, the guard exits with code 0 (allowed) before any pattern checks run. the fix only modifies the `.route/` pattern check, not the privilege flow.

**adherance**: yes — privilege bypass preserved in flow order

### usecase.6: no bound route allows all

| criterion | blueprint satisfies? |
|-----------|---------------------|
| unbound branch → all allowed | yes — not modified |

**why it holds**: the blueprint only modifies the pattern check AFTER the bound route is found. if no route is bound, the guard exits early. this path is unchanged.

**adherance**: yes — early exit path preserved

### usecase.7: blocker location

| criterion | blueprint satisfies? |
|-----------|---------------------|
| blocker at `$route/blocker/*.md` | yes — codepath changes |
| NOT at `$route/.route/blocker/*.md` | yes — same fix |

**blueprint addresses**:
- `getBlockedChallengeDecision.ts`: path.join without `.route` segment
- `stepRouteDrive.ts`: same change

**why it holds**:

the criteria wants blockers at `$route/blocker/`, not `$route/.route/blocker/`.

the blueprint changes remove the `.route` segment from path construction:

| file | before | after |
|------|--------|-------|
| getBlockedChallengeDecision.ts | `path.join(route, '.route', 'blocker', ...)` | `path.join(route, 'blocker', ...)` |
| stepRouteDrive.ts | `${route}/.route/blocker/...` | `${route}/blocker/...` |

both locations compute the same path differently (one uses `path.join`, one uses template literal). the fix addresses both.

the unit test assertions also change:
```
before: expect(result.articulationPath).toContain('.route/blocker/3.blueprint.md')
after:  expect(result.articulationPath).toContain('blocker/3.blueprint.md')
```

**adherance**: yes — both code and test assertions updated

---

## deviation check

### did the junior misinterpret or deviate?

**check 1**: does the grep pattern change match the spec?

- vision: allow `$route/artifact.md`, block `$route/.route/*`
- blueprint: `^$ROUTE_DIR/\.route/` — blocks only `$route/.route/*` prefix
- deviation: none

**check 2**: does the blocker path change match the spec?

- vision: move from `$route/.route/blocker/` to `$route/blocker/`
- blueprint: removes `.route` segment from path.join
- deviation: none

**check 3**: are all test updates aligned?

- vision: routes at `.route/` should work
- blueprint: adds tests for `.route/xyz/` bound route
- deviation: none

**check 4**: are any invariants violated?

- vision: `.behavior/` routes unchanged
- blueprint: explicitly states backwards compatible in invariants
- deviation: none

---

## gaps found

### none

the blueprint adheres to the behavior declaration:
1. all vision outcomes are addressed
2. all criteria usecases are satisfied
3. no misinterpretation of the spec detected
4. no deviation from the declared behavior

---

## conclusion

the blueprint correctly implements the behavior declaration:

| artifact | adherance |
|----------|-----------|
| vision outcomes | all 4 addressed |
| criteria usecases | all 7 satisfied |
| mental model | preserved |
| backwards compat | explicit in invariants |

no drift, misinterpretation, or deviation found.

