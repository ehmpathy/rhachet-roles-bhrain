# self-review r2: has-pruned-yagni

## pause

i am the reviewer, not the author.

i re-read the blueprint and questioned whether each component is necessary.

YAGNI = "you ain't gonna need it"

---

## component 1: guard logic fix (route.mutate.guard.sh)

**was this explicitly requested?** yes.

**evidence from wish**:
> writes to @reporoot/.route/xyz should be permitted if the bound route is @reporoot/.route/xyz
> but @reporoot/.route/xyz/.route should be blocked

**evidence from vision**:
> the guard distinguishes between:
> 1. the route directory itself — where artifacts live
> 2. the .route/ subdirectory within a route — where metadata lives

**is this the minimum viable way?** yes — a change to the grep pattern from `\.route/` to `^$ROUTE_DIR/\.route/` is the minimal fix.

**verdict**: necessary ✓

---

## component 2: blocker path change (getBlockedChallengeDecision.ts)

**was this explicitly requested?** yes.

**evidence from wish**:
> lets add the requirement that the blocker explanation files should go into $route/blocker, not $route/.route/blocker

**is this the minimum viable way?** yes — removal of one path segment (`.route`) from the path.join call.

**verdict**: necessary ✓

---

## component 3: integration tests for guard at .route/ location

**was this explicitly requested?** not explicitly, but implied by criteria.

**evidence from criteria (2.1.criteria.blackbox)**:
> given('route bound at .route/xyz/')
>   when('driver writes to .route/xyz/artifact.md')
>     then('write is allowed')

tests prove the fix works. without tests, we have no proof.

**is this the minimum viable way?** the blueprint lists 4 test cases:
- [t0] artifact write to route root → allowed
- [t1] artifact write to subdirectory → allowed
- [t2] metadata write to .route/ subdirectory → blocked
- [t3] blocker write → allowed

**could we reduce?** [t1] (subdirectory) was flagged in `has-questioned-deletables` r1 as "arguably removable" but retained for defensive coverage at negligible cost.

**verdict**: necessary ✓ — tests are required to prove fix works

---

## component 4: acceptance tests for guard at .route/ location

**was this explicitly requested?** not explicitly, but implied.

**is this the minimum viable way?** integration tests already prove the shell procedure logic. do we need acceptance tests too?

**what acceptance tests add**:
- prove end-to-end through full skill invocation
- prove symlinks, path resolution, etc. work in real scenario
- catch integration issues between layers

**could we skip?** risky — integration tests mock stdin, acceptance tests use real invocation. the gap could hide issues.

**verdict**: necessary ✓ — acceptance tests catch issues integration tests miss

---

## component 5: blocker path test updates

**was this explicitly requested?** no, but required by the path change.

**why?** if we change the blocker path in prod code, tests that assert on the old path will fail. these are not new tests — they are updates to extant tests.

**is this the minimum viable way?** yes — minimal change to make extant tests pass.

**verdict**: necessary ✓ — tests must pass

---

## component 6: 5-step execution sequence

**was this explicitly requested?** no.

**is it necessary?** the sequence is:
1. extend guard logic
2. add guard tests
3. update blocker path
4. update blocker tests
5. verify

this is a work order, not a deliverable. it helps execution but adds no runtime value.

**is it YAGNI?** no — execution sequence is support structure for the implementer. it's not shipped code.

**verdict**: acceptable support structure ✓

---

## potential YAGNI: subdirectory test case [t1]

**what is it?** test case for artifact write to `.route/xyz/subdir/doc.md`

**was it requested?** not explicitly. criteria says "write to .route/xyz/artifact.md" (root) and "write to .route/xyz/blocker/*.md" (blocker subdir).

**why it exists**: defensive — ensures the fix works for nested paths, not just root.

**cost**: one additional assertion in test file. negligible.

**risk of removal**: if guard logic has a bug with nested paths, we would not catch it.

**verdict**: keep — cost is negligible, risk of removal is non-zero

---

## potential YAGNI: invariants section

**what is it?** the "invariants" section at the end of the blueprint lists:
- routes at .behavior/ continue to work identically
- privilege flag bypasses all protection
- no bound route means no protection
- stones and guards remain protected regardless of route location
- blocker articulation is now visible alongside artifacts

**was it requested?** not explicitly.

**why it exists**: documents what must NOT change. helps reviewer verify backwards compatibility.

**is it YAGNI?** no — invariants are documentation, not shipped code. they aid review.

**verdict**: acceptable documentation ✓

---

## issues found

### none

all components are either:
1. explicitly requested in wish/vision/criteria
2. required to prove the requested changes work (tests)
3. support structure/documentation that aids execution but isn't shipped

no premature optimization. no "while we're here" additions. no "future flexibility" abstractions.

---

## conclusion

the blueprint is minimal. every component serves the stated goals:
- guard fix → explicitly requested
- blocker path change → explicitly requested
- tests → required to prove changes work
- execution sequence → support structure for implementer
- invariants → documentation for reviewer

YAGNI check passed. no extras to remove.

