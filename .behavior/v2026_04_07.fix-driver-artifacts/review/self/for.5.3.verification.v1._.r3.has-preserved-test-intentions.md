# has-preserved-test-intentions review (r3)

## slow review process

1. enumerate all test files changed
2. for each modified test, verify intent is preserved
3. for each snapshot change, verify it reflects real behavior
4. verify no assertions were weakened

---

## step 1: enumerate test files changed

**command:**
```
git diff main --name-status
```

**test files (`.test.ts`) changed:**

| status | file |
|--------|------|
| (none) | no `.test.ts` files were modified |

**snapshot files (`.snap`) changed:**

| status | file |
|--------|------|
| M | `blackbox/__snapshots__/driver.route.guard-cwd.acceptance.test.ts.snap` |
| M | `blackbox/__snapshots__/driver.route.journey.acceptance.test.ts.snap` |
| M | `blackbox/__snapshots__/driver.route.set.acceptance.test.ts.snap` |
| M | `blackbox/__snapshots__/reflect.journey.acceptance.test.ts.snap` |
| M | `blackbox/__snapshots__/reflect.savepoint.acceptance.test.ts.snap` |

**why it holds:**
- zero test files were modified
- only one test file was added: `asArtifactByPriority.test.ts` (new)
- five snapshot files were modified

---

## step 2: verify test file modifications

**no test files were modified.**

the only test file in scope is `asArtifactByPriority.test.ts`, which is new. there are no prior intentions to preserve for a new file.

---

## step 3: verify snapshot changes

### snapshot group 1: intentional changes (3 files)

**files:**
- `driver.route.guard-cwd.acceptance.test.ts.snap`
- `driver.route.journey.acceptance.test.ts.snap`
- `driver.route.set.acceptance.test.ts.snap`

**what changed:**

all three files have the same pattern:
```diff
-   │          └─ on 1.vision*.md
+   │          └─ on $route/1.vision*.md
```

**why this is intentional:**

the change is in `getAllStoneArtifacts.ts`:
```typescript
// before
const globs = [`${input.stone.name}*.md`];

// after
const globs = [
  `${input.route}/${input.stone.name}.yield*`,
  `${input.route}/${input.stone.name}*.md`,
];
```

the glob pattern now includes `$route/` prefix. this is the implemented feature: artifact discovery now uses route-relative paths for cache specificity.

**does this preserve test intention?**

yes. the tests verify that:
1. guards enumerate artifacts correctly (still true)
2. cache entries are created (still true)
3. cache keys reflect the glob pattern (now more specific)

the test intention is "guard reviews are cached by artifact glob." that intention is preserved. the glob is now more specific, but the behavior is the same.

### snapshot group 2: unrelated changes (2 files)

**files:**
- `reflect.journey.acceptance.test.ts.snap`
- `reflect.savepoint.acceptance.test.ts.snap`

**what changed:**

```diff
-   ├─ commit = 79c62ef
+   ├─ commit = [HASH]
```

and

```diff
-      └─ [TIMESTAMP] (commit=10fda07, patches=04f1ec0, [SIZE]ytes)
+      └─ [TIMESTAMP] (commit=c34fdcb, patches=04f1ec0, [SIZE]ytes)
```

**why this is unrelated:**

these are commit hash changes in the test environment. the reflect tests create savepoints that include the current commit hash. when the repo changes (any commit), the hash changes.

**does this preserve test intention?**

yes. the test intention is "reflect savepoint captures current commit." the commit hash changed because the repo changed. the behavior is identical.

---

## step 4: verify no assertions were weakened

### question 1: did any `expect` calls change?

**verification:** search for modified expect calls.
```
git diff main -- '*.test.ts' --no-ext-diff
```

**result:** no output (no test files modified)

**why it holds:** zero test files were modified. all `expect` calls remain unchanged.

### question 2: did any snapshot assertions become less strict?

**verification:** read snapshot diffs.

| snapshot | before | after | less strict? |
|----------|--------|-------|--------------|
| guard-cwd | `on 1.vision*.md` | `on $route/1.vision*.md` | no (more specific) |
| journey | `on 3.blueprint*.md` | `on $route/3.blueprint*.md` | no (more specific) |
| route-set | `on 1.test*.md` | `on $route/1.test*.md` | no (more specific) |
| reflect-journey | `commit=79c62ef` | `commit=[HASH]` | no (normalization improved) |
| reflect-savepoint | `commit=10fda07` | `commit=c34fdcb` | no (just different hash) |

**why it holds:** all snapshot changes either add specificity or reflect normal test environment changes.

---

## summary

| question | answer | evidence |
|----------|--------|----------|
| were any test files modified? | no | `git diff main --name-status` shows no M status for `.test.ts` |
| were any assertions weakened? | no | no test file changes = no assertion changes |
| do snapshot changes preserve intention? | yes | glob patterns more specific, commit hashes are environment |
| was any test removed? | no | only additions, no deletions |

**test intentions preserved. no assertions weakened. no tests removed.**
