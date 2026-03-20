# self-review r1: has-questioned-deletables

## pause

i am the reviewer, not the author.

i re-read the blueprint and questioned each component.

---

## component: guard logic fix (route.mutate.guard.sh)

**can this be removed?** no.

**why it holds**: the fix is the core of the wish. without it, artifact writes to routes at `.route/xyz/` remain blocked. the guard currently treats ALL paths with `.route/` as protected. the fix narrows this to `$ROUTE_DIR/.route/` only.

if i deleted this and had to add it back, would i? yes — this is the entire reason for the behavior.

---

## component: blocker path change (getBlockedChallengeDecision.ts)

**can this be removed?** no.

**why it holds**: the wish explicitly states "blocker explanation files should go into $route/blocker, not $route/.route/blocker". this is a direct requirement, not an optimization.

if i deleted this and had to add it back, would i? yes — the wish mandates it.

---

## component: test case [t1] (subdirectory artifact write)

**can this be removed?** arguably yes.

**analysis**: if [t0] (artifact.md in route root) passes, then [t1] (doc.md in subdir) should also pass since the guard logic is identical — it just checks whether the path is NOT in `.route/` subdirectory.

**decision**: retain.

**why**: the test is cheap (one additional assertion) and provides explicit proof that subdirectories work. it's defensive — if guard logic changes in the future, this test catches regressions that [t0] alone might miss.

**what is the simplest version?** the simplest version would skip [t1]. but simplest is not always best — [t1] adds negligible cost and catches a class of regressions.

---

## component: acceptance tests for `.route/xyz/` routes

**can this be removed?** no.

**why it holds**: the acceptance tests prove end-to-end behavior through the full skill invocation path. integration tests prove shell procedure logic in isolation. both are needed:
- integration tests catch logic errors quickly
- acceptance tests catch integration errors (symlinks, path resolution, etc.)

if i deleted acceptance tests and had to add them back, would i? yes — the fix enables a new route location pattern that deserves full-stack proof.

---

## component: update to extant blocker tests

**can this be removed?** no.

**why it holds**: the blocker path change breaks extant tests that assert the old path. the updates are not optional — tests fail without them.

if i deleted these updates and had to add them back, would i? yes, immediately — tests would fail.

---

## component: execution sequence (5 steps)

**can this be simplified?** marginally.

**analysis**: steps could be grouped:
- steps 1+2: guard fix + tests
- steps 3+4: blocker path + tests
- step 5: verify

but the granular steps are clearer for progress tracking. the work is the same either way.

**decision**: retain granular steps for clarity.

---

## conclusion

no components can be deleted:
- guard fix is the core of the wish
- blocker path change is mandated by the wish
- test updates are required for tests to pass
- test extensions prove new behavior works

one component could arguably be simplified ([t1] test case), but the cost is negligible and the defensive value is present.

the blueprint is minimal.
