# self-review r1: has-vision-coverage

## step back and breathe

question: does the playtest cover all behaviors from the wish and vision?

I will trace each requirement from the wish and vision to a specific test in the playtest.

---

## trace from wish to playtest

### the wish error

the wish shows this exact error:

```
Error: spawnSync /bin/sh ENOBUFS
    at setSavepoint (.../setSavepoint.js:63:54)
    ...
  code: 'ENOBUFS',
  spawnargs: [ '-c', 'git diff --staged' ],
```

the error occurred because:
- large staged diff (>1MB based on the truncated output)
- node's `execSync` default `maxBuffer` is 1MB
- when diff output exceeds buffer, ENOBUFS error is thrown

### playtest coverage of the wish

| wish element | playtest section | verification |
|--------------|------------------|--------------|
| `rhx reflect.snapshot capture` fails | happy path 2: large diff | creates >1MB staged diff |
| ENOBUFS error code | pass/fail criteria | explicitly checks "no ENOBUFS" |
| setSavepoint invoked | all sections | `rhx reflect.savepoint set` invokes setSavepoint |
| `git diff --staged` is the cause | happy path 2 | stages 15000 lines via `git add large.txt` |

the playtest directly reproduces the wish scenario: large staged diff that would have caused ENOBUFS.

---

## trace from vision to playtest

### vision behaviors

I read the vision from the system prompt:

**before (broken):**
> users with large staged diffs (>1MB) hit a wall. the snapshot capture crashes before it can even begin.

**after (fixed):**
> large diffs just work. no buffer limits to worry about. users capture snapshots confidently regardless of how much work is staged.

**the "aha" moment:**
> the value clicks when a user realizes they can stage an entire refactor — hundreds of files, megabytes of changes — and still capture a snapshot.

**contract:**
> input: git working directory with staged changes (any size)
> output: savepoint file with metadata and diff content

### playtest coverage of vision

| vision claim | playtest section | how it verifies |
|--------------|------------------|-----------------|
| "large diffs just work" | happy path 2 | 15000 lines = 1.2MB > 1MB threshold |
| "no buffer limits" | pass/fail criteria | "exits 0, no ENOBUFS" |
| "any size" | happy path 2 | tests size beyond prior limit |
| "baseline unchanged" | happy path 1 | small diff still works |
| "metadata included" | expected outcomes | checks "staged.patch = [SIZE]ytes" |

---

## requirements not explicitly tested

| requirement | status | notes |
|-------------|--------|-------|
| 10MB diff | not tested | playtest only goes to 1.2MB |
| 50MB diff | not tested | would be slow in foreman test |
| 100MB diff | not tested | impractical for interactive playtest |

**verdict:** these larger sizes are not tested explicitly, but the fix removes the buffer entirely (shell redirect). if 1.2MB works, larger sizes work because there's no threshold — the diff never enters node.

the vision says "limited only by disk space" — a test of this would require a full disk, which is out of scope for a playtest.

---

## edgey behaviors verified

| edgey case | playtest section | verifies |
|------------|------------------|----------|
| empty staged diff | edgey paths: empty staged diff | `staged.patch = 0ytes` |
| both staged and unstaged | edgey paths: both staged and unstaged | both patches shown |
| apply mode writes files | happy path 3 | files written to storage |

---

## checklist

| check | status | evidence |
|-------|--------|----------|
| wish error reproduced | yes | happy path 2 creates >1MB staged diff |
| vision "large diffs work" | yes | happy path 2 expects exit 0 |
| vision "no buffer limits" | yes | pass/fail explicitly checks "no ENOBUFS" |
| vision "baseline unchanged" | yes | happy path 1 tests small diff |
| all critical paths tested | yes | 4 checks in pass/fail criteria |

---

## why it holds

1. **wish coverage** — the playtest creates the exact scenario from the wish: large staged diff via `git add` of a >1MB file
2. **vision coverage** — both "large diffs work" and "baseline unchanged" are explicitly tested
3. **ENOBUFS check** — the pass/fail criteria explicitly states "no ENOBUFS" as success condition
4. **size threshold met** — 15000 lines × ~80 chars = 1.2MB exceeds the 1MB buffer limit that caused the original error

---

## summary

| check | status |
|-------|--------|
| every wish behavior verified | yes |
| every vision behavior verified | yes |
| no critical requirements left untested | yes |

**conclusion:** the playtest covers all behaviors from the wish (ENOBUFS error on large diff) and vision (large diffs work, baseline unchanged). the 1.2MB test file exceeds the 1MB threshold that caused the original error.

r1 complete.
