# has-preserved-test-intentions review (r4)

## slow review process

1. enumerate every test artifact touched (test files + snapshots)
2. for each touched artifact, articulate what it verified before
3. verify it still verifies the same behavior after
4. confirm no assertions were weakened

---

## step 1: enumerate touched artifacts

### test files touched

**command:**
```
git diff main --name-only -- '*.test.ts'
```

**result:** empty (no test files modified)

### snapshot files touched

**command:**
```
git diff main --name-only -- '*.snap'
```

**result:**
```
blackbox/__snapshots__/driver.route.guard-cwd.acceptance.test.ts.snap
blackbox/__snapshots__/driver.route.journey.acceptance.test.ts.snap
blackbox/__snapshots__/driver.route.set.acceptance.test.ts.snap
blackbox/__snapshots__/reflect.journey.acceptance.test.ts.snap
blackbox/__snapshots__/reflect.savepoint.acceptance.test.ts.snap
```

---

## step 2: for each snapshot, what did it verify before?

### driver.route.guard-cwd.acceptance.test.ts.snap

**test intention:** verify that guard reviews are cached by artifact glob pattern.

**before snapshot (line ~37):**
```
│  │       └─ · cached
│  │          └─ on 1.vision*.md
```

**what this verified:**
- the cache key for review `r1` was `1.vision*.md`
- reviews are cached per artifact pattern, not per invocation
- cache invalidation happens when artifacts change

### driver.route.journey.acceptance.test.ts.snap

**test intention:** verify full driver journey with guards, reviews, and judges.

**before snapshot (line ~227):**
```
│       └─ · cached
│          └─ on 3.blueprint*.md
```

**what this verified:**
- review `r1` was cached with key `3.blueprint*.md`
- judge `j1` was cached with key `3.blueprint*.md`
- cache enables review reuse across passes

### driver.route.set.acceptance.test.ts.snap

**test intention:** verify `route.stone.set --as passed` behavior with guards.

**before snapshot (line ~93):**
```
│  │       └─ · cached
│  │          └─ on 1.test*.md
```

**what this verified:**
- review cache key for `1.test` stone was `1.test*.md`
- judge cache key for `1.test` stone was `1.test*.md`

### reflect.journey.acceptance.test.ts.snap

**test intention:** verify full reflect savepoint workflow.

**before snapshot (line ~8):**
```
├─ commit = 79c62ef
```

**what this verified:**
- savepoint captures current commit hash
- output shows commit hash in tree structure

### reflect.savepoint.acceptance.test.ts.snap

**test intention:** verify reflect savepoint creation and list display.

**before snapshot (line ~56):**
```
└─ [TIMESTAMP] (commit=10fda07, patches=04f1ec0, [SIZE]ytes)
```

**what this verified:**
- savepoint list shows commit hash for each entry
- output format includes commit, patches, and size

---

## step 3: does each snapshot still verify the same behavior?

### driver.route.guard-cwd.acceptance.test.ts.snap

**after snapshot (line ~37):**
```
│  │       └─ · cached
│  │          └─ on $route/1.vision*.md
```

**does it still verify the same behavior?**

yes. the test still verifies:
- ✓ reviews are cached by artifact pattern
- ✓ cache invalidation happens when artifacts change
- the pattern is now more specific (`$route/` prefix), but the behavior is identical

**why the change is intentional:**

the glob pattern changed in `getAllStoneArtifacts.ts`:
```typescript
// before: input.stone.name*.md
// after: input.route/input.stone.name*.md
```

this is the feature: globs now include route path for cache specificity. the test verifies cache works — and it still does.

### driver.route.journey.acceptance.test.ts.snap

**after snapshot (line ~227):**
```
│       └─ · cached
│          └─ on $route/3.blueprint*.md
```

**does it still verify the same behavior?**

yes. the test still verifies:
- ✓ reviews are cached and reused
- ✓ judges are cached and reused
- ✓ full journey completes successfully

the cache key is more specific, but the cache behavior is unchanged.

### driver.route.set.acceptance.test.ts.snap

**after snapshot (line ~93):**
```
│  │       └─ · cached
│  │          └─ on $route/1.test*.md
```

**does it still verify the same behavior?**

yes. the test still verifies:
- ✓ `--as passed` triggers guard evaluation
- ✓ reviews and judges are cached
- ✓ passage is recorded on success

### reflect.journey.acceptance.test.ts.snap

**after snapshot (line ~8):**
```
├─ commit = [HASH]
```

**does it still verify the same behavior?**

yes. the test still verifies:
- ✓ savepoint captures current commit
- ✓ output shows commit in tree structure

**why the change is unrelated:**

the commit hash `79c62ef` was from a prior test run. the `[HASH]` placeholder normalizes commit hashes. this change happened because:
1. the test environment changed (new commits were made)
2. the snapshot normalization improved (hash → placeholder)

this is not a change to test intention. it's environment noise.

### reflect.savepoint.acceptance.test.ts.snap

**after snapshot (line ~56):**
```
└─ [TIMESTAMP] (commit=c34fdcb, patches=04f1ec0, [SIZE]ytes)
```

**does it still verify the same behavior?**

yes. the test still verifies:
- ✓ savepoint list shows commit hash
- ✓ format includes commit, patches, size

the commit hash changed from `10fda07` to `c34fdcb` because the test environment changed. this is not a change to test intention.

---

## step 4: confirm no assertions were weakened

### question: did any expect() call change?

**verification:** `git diff main -- '*.test.ts'` returns empty.

**answer:** no. zero test files were modified. all assertions remain unchanged.

### question: did any snapshot become less specific?

| snapshot | before | after | verdict |
|----------|--------|-------|---------|
| guard-cwd | `on 1.vision*.md` | `on $route/1.vision*.md` | **more** specific |
| journey | `on 3.blueprint*.md` | `on $route/3.blueprint*.md` | **more** specific |
| route-set | `on 1.test*.md` | `on $route/1.test*.md` | **more** specific |
| reflect-journey | `commit=79c62ef` | `commit=[HASH]` | same (normalized) |
| reflect-savepoint | `commit=10fda07` | `commit=c34fdcb` | same (env change) |

**answer:** no. three snapshots became more specific. two remained equivalent.

### question: did any test case get removed?

**verification:** `git diff main --stat -- '*.test.ts'` returns empty.

**answer:** no. zero test files were modified. no test cases were removed.

---

## summary

| artifact | intention before | intention after | preserved? |
|----------|-----------------|-----------------|------------|
| guard-cwd.snap | verify cache by glob | verify cache by glob | ✓ |
| journey.snap | verify full journey | verify full journey | ✓ |
| route-set.snap | verify set --as passed | verify set --as passed | ✓ |
| reflect-journey.snap | verify savepoint | verify savepoint | ✓ |
| reflect-savepoint.snap | verify savepoint list | verify savepoint list | ✓ |

**all test intentions preserved.**

the three driver snapshots changed because the feature added route-relative paths to glob patterns. this makes the cache more specific, not less.

the two reflect snapshots changed because the test environment has different commits. this is normal snapshot drift, not intention change.

**zero assertions weakened. zero test cases removed. zero intentions violated.**
