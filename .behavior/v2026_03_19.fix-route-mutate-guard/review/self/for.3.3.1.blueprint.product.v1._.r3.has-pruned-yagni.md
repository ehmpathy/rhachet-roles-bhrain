# self-review r3: has-pruned-yagni

## pause

i am the reviewer, not the author.

r2 was too shallow. it accepted all elements at face value. r3 must dig deeper and genuinely challenge whether each component is truly needed.

the question is not "is this useful?" but "is this the minimum required to satisfy the stated goals?"

---

## re-read the wish

> looks like the route.mutate guard is overzelous
> writes to @reporoot/.route/xyz should be permitted if the bound route is @reporoot/.route/xyz
> but @reporoot/.route/xyz/.route should be blocked
> also, lets add the requirement that the blocker explanation files should to into $route/blocker, not $route/.route/blocker

the wish asks for:
1. guard fix for routes at `.route/`
2. blocker path relocation

that's it. two things.

---

## challenge 1: do we need BOTH integration AND acceptance tests?

**the blueprint says**: add integration tests AND acceptance tests for the guard fix.

**what each tests**:
- integration tests: invoke guard shell procedure directly via stdin JSON
- acceptance tests: invoke guard via full skill invocation path

**minimum viable**: if integration tests pass, does the fix work? yes, for the shell procedure logic.

**what acceptance tests add**:
- symlink resolution
- path normalization
- skill invocation wrapper

**risk if we omit acceptance tests**: if the skill wrapper mangles paths, we wouldn't catch it.

**verdict**: acceptance tests are risk mitigation, not strictly required. but cost is low (one journey).

**action**: keep both, but note this is defensive, not minimum

---

## challenge 2: do we need 4 test cases for guard?

**the blueprint says**:
- [t0] artifact write to route root → allowed
- [t1] artifact write to subdirectory → allowed
- [t2] metadata write to .route/ subdirectory → blocked
- [t3] blocker write → allowed

**minimum viable**: what proves the fix works?
- [t0] proves artifacts are allowed (new behavior)
- [t2] proves metadata is blocked (preserved behavior)

**are [t1] and [t3] necessary?**
- [t1] (subdirectory): if [t0] passes, why would subdirectory fail? the guard checks prefix, not depth.
- [t3] (blocker): this tests blocker path, which is tested separately in blocker tests.

**counterargument**:
- [t1]: guards against edge case where nested paths are handled differently
- [t3]: guards against interaction between guard logic and blocker location

**verdict**: [t1] is defensive but cheap. [t3] could be removed — blocker path is tested elsewhere.

**issue found**: [t3] is YAGNI for guard tests. blocker path is tested in blocker acceptance tests.

---

## challenge 3: is the execution sequence necessary?

**the blueprint says**: 5 steps
1. extend guard logic
2. add guard tests
3. update blocker path
4. update blocker tests
5. verify

**minimum viable**: could we just say "implement the changes"?

**what the sequence adds**: order discipline — guard logic before blocker path, tests after each change.

**is this YAGNI?** it's not shipped code. it's work order. but does it need to be in the blueprint?

**verdict**: execution sequence helps implementer but could be derived from the filediff tree. however, it adds clarity without cost.

**action**: keep, but acknowledge it's optional structure

---

## challenge 4: is the invariants section necessary?

**the blueprint says**: 5 invariants
- routes at .behavior/ continue to work identically
- privilege flag bypasses all protection
- no bound route means no protection
- stones and guards remain protected regardless of route location
- blocker articulation is now visible alongside artifacts

**minimum viable**: what if we just tested the changes and assumed invariants hold?

**what invariants add**: explicit statement of what must NOT break. helps reviewer verify backwards compatibility.

**is this YAGNI?** it's documentation, not code. but does the blueprint need to state the obvious?

**analysis**:
- "routes at .behavior/ continue to work" — this is the key invariant, must be stated
- "privilege flag bypasses" — pre-extant behavior, not changed, could omit
- "no bound route means no protection" — pre-extant behavior, not changed, could omit
- "stones and guards remain protected" — pre-extant behavior, not changed, could omit
- "blocker articulation is now visible" — this is the change, not an invariant

**issue found**: invariants section mixes unchanged behaviors with the change. only item 1 is a true invariant that needs verification.

---

## challenge 5: is the codepath tree too detailed?

**the blueprint says**: shows before/after code snippets for guard and blocker path

**minimum viable**: could we just describe the change in prose?

**what the code snippets add**: exact implementation detail, no ambiguity

**is this YAGNI?** it's not premature abstraction or feature creep. it's specificity.

**verdict**: code snippets are helpful, not YAGNI. they reduce implementation ambiguity.

---

## challenge 6: is the filediff tree accurate?

**the blueprint lists 5 files**:
- route.mutate.guard.sh (extend)
- getBlockedChallengeDecision.ts (update)
- getBlockedChallengeDecision.test.ts (update)
- driver.route.mutate.acceptance.test.ts (extend)
- driver.route.blocked.acceptance.test.ts (update)

**is any file absent?** where are the integration tests?

**check**: the blueprint mentions integration tests in "test coverage" but doesn't list the file in filediff tree.

**issue found**: `route.mutate.guard.integration.test.ts` is absent from filediff tree

---

## issues found and fixed

### 1. [FIXED] removed test case [t3] for blocker write in guard tests

**what was wrong**: the blueprint included `[t3] Write to .route/xyz/blocker/defect.md → allowed` in guard integration tests.

**why YAGNI**: blocker path is already tested in blocker acceptance tests (`driver.route.blocked.acceptance.test.ts`). to test it again in guard tests is redundant.

**fix applied**: removed [t3] from integration test cases. now has 3 cases: artifact (t0), subdirectory (t1), metadata (t2).

**before**:
```
given('[case N] bound route at .route/xyz/')
  when('[t0] Write to .route/xyz/artifact.md') → allowed
  when('[t1] Write to .route/xyz/subdir/doc.md') → allowed
  when('[t2] Write to .route/xyz/.route/passage.jsonl') → blocked
  when('[t3] Write to .route/xyz/blocker/defect.md') → allowed  ← redundant
```

**after**:
```
given('[case N] bound route at .route/xyz/')
  when('[t0] Write to .route/xyz/artifact.md') → allowed
  when('[t1] Write to .route/xyz/subdir/doc.md') → allowed
  when('[t2] Write to .route/xyz/.route/passage.jsonl') → blocked
```

### 2. [FIXED] removed [t2] blocker test from acceptance tests

**what was wrong**: the acceptance test journey included `[t2] guard allows blocker write`.

**why YAGNI**: same reason — blocker path tested in blocker acceptance tests.

**fix applied**: removed [t2] from acceptance journey. now has 2 cases.

**before**:
```
given('[case N] bound route at .route/xyz/')
  when('[t0] guard allows artifact write')
  when('[t1] guard blocks metadata write')
  when('[t2] guard allows blocker write')  ← redundant
```

**after**:
```
given('[case N] bound route at .route/xyz/')
  when('[t0] guard allows artifact write')
  when('[t1] guard blocks metadata write')
```

### 3. [FIXED] simplified invariants section

**what was wrong**: listed 5 items, but 4 were pre-extant behaviors that aren't changed by this fix.

**why YAGNI**: to state "privilege flag still works" is obvious — we didn't touch it.

**fix applied**: reduced to 1 invariant.

**before**:
```
- routes at `.behavior/` continue to work identically
- privilege flag bypasses all protection
- no bound route means no protection
- stones and guards remain protected regardless of route location
- blocker articulation is now visible alongside artifacts
```

**after**:
```
- routes at `.behavior/` continue to work identically (backwards compatible)
```

### 4. [FIXED] added absent file to filediff tree

**what was wrong**: `route.mutate.guard.integration.test.ts` was mentioned in test coverage but not in filediff tree.

**why issue**: filediff tree should list all modified files.

**fix applied**: added the integration test file to filediff tree.

**before** (excerpt):
```
src/
├─ domain.roles/driver/skills/
│  └─ [~] route.mutate.guard.sh
```

**after** (excerpt):
```
src/
├─ domain.roles/driver/skills/
│  ├─ [~] route.mutate.guard.sh
│  └─ [~] route.mutate.guard.integration.test.ts
```

---

## conclusion

the blueprint had YAGNI that has now been fixed:
1. ~~redundant test case [t3]~~ → removed
2. ~~redundant acceptance test [t2]~~ → removed
3. ~~verbose invariants~~ → simplified to 1
4. ~~absent integration test file~~ → added

the blueprint is now minimal: it contains only what is needed to satisfy the wish, with no extras.

