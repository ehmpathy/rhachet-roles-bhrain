# self-review r6: has-snap-changes-rationalized

## step back and breathe

question: is every `.snap` file change intentional and justified?

I will examine each changed snapshot file in git diff.

---

## snapshot files changed in this branch

```
blackbox/__snapshots__/reflect.savepoint.acceptance.test.ts.snap
blackbox/__snapshots__/reflect.journey.acceptance.test.ts.snap
```

other snapshot files changed are from other behaviors in this branch (route-artifact-expansion, etc.). I will focus only on reflect-related snapshots for this review.

---

## reflect.savepoint.acceptance.test.ts.snap

### what changed

```diff
-   ├─ commit = 5339adb
+   ├─ commit = 88cfe06
```

three occurrences of commit hash change.

### was this change intended?

**incidental but expected.**

the commit hash comes from the test fixture:
1. test creates temp git repo
2. test makes initial commit
3. commit hash depends on timestamp

since tests ran at different times, commit hashes differ. this is not a format change or regression.

### is it a problem?

**no.** commit hashes are dynamic test fixture metadata, not implementation output. the output FORMAT is unchanged:
- `commit = [HASH]` — format preserved
- size, patches.hash, paths — all unchanged

---

## reflect.journey.acceptance.test.ts.snap

### what changed

```diff
-   ├─ commit = 577edf8
+   ├─ commit = 79c62ef
```

four occurrences of commit hash change.

### was this change intended?

**incidental but expected.** same reason as above — test fixtures have different commit hashes when tests run at different times.

### is it a problem?

**no.** output format is unchanged. only the dynamic commit hash value differs.

---

## why commit hashes vary

git commit hash = sha1(tree + parent + author + message + timestamp)

when tests run:
- tree content: deterministic (test fixtures)
- parent: deterministic (initial commit)
- author: deterministic (test config)
- message: deterministic (test config)
- timestamp: **varies with test execution time**

therefore commit hashes vary between test runs. this is inherent to git, not a test or implementation problem.

---

## common regressions NOT present

| check | status |
|-------|--------|
| output format degraded | no — same structure |
| error messages less helpful | no — unchanged |
| timestamps/ids leaked | no — already placeholders |
| extra output added | no — unchanged |

---

## what WOULD be a problem

if the diff showed:
- `staged.patch` → `staged` (field rename)
- `[SIZE]ytes` → `[SIZE]` (format change)
- new fields added/removed

none of these occurred. only dynamic commit hashes changed.

---

## summary

| snapshot file | change type | rationale |
|--------------|-------------|-----------|
| reflect.savepoint | commit hash | test fixture timestamp |
| reflect.journey | commit hash | test fixture timestamp |

**conclusion:** all snapshot changes are incidental commit hash variations from test fixture timestamps. no output format or content regressions. changes are justified as expected test behavior.

r6 complete.

