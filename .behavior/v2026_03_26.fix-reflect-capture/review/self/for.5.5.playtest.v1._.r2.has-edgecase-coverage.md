# self-review r2: has-edgecase-coverage

## step back and breathe

question: are edge cases covered?

I will enumerate what could go wrong and trace each to the playtest.

---

## what could go wrong?

I read `5.5.playtest.v1.i1.md` and enumerate potential failure modes:

### 1. diff size at exact threshold

| scenario | what could go wrong | playtest coverage |
|----------|---------------------|-------------------|
| diff = 1MB exactly | off-by-one error | not tested |
| diff = 1MB - 1 byte | just under threshold | not tested |
| diff = 1MB + 1 byte | just over threshold | not tested |
| diff = 1.2MB | well over threshold | happy path 2: tested |

**verdict:** the playtest uses 1.2MB which is safely above the threshold. exact boundary tests would be fragile (line count → byte count varies by content). 1.2MB provides margin.

### 2. empty diff states

| scenario | what could go wrong | playtest coverage |
|----------|---------------------|-------------------|
| no staged changes | empty staged diff | edgey paths: tested |
| no unstaged changes | empty unstaged diff | implicit (happy path 1) |
| no changes at all | both empty | not tested |

**gap found:** the playtest doesn't explicitly test "no changes at all" — but this is acceptable because:
- happy path 1 has staged but no unstaged (implicit empty unstaged)
- edgey paths: empty staged diff has unstaged (large.txt is unstaged after reset)
- "no changes at all" is the same as empty staged + empty unstaged

### 3. mixed diff states

| scenario | what could go wrong | playtest coverage |
|----------|---------------------|-------------------|
| staged only | typical case | happy path 1, 2 |
| unstaged only | no staged, some unstaged | not tested |
| both staged and unstaged | mixed | edgey paths: tested |

**gap found:** "unstaged only" is not tested.

**fix needed?** I checked the implementation: `setSavepoint` handles staged and unstaged independently via separate shell redirects. if one is empty, its file is 0 bytes. the mechanism doesn't depend on one to have content for the other to work.

**verdict:** acceptable. the code paths are symmetric; if one works when empty, the other works when empty.

### 4. apply vs plan modes

| scenario | what could go wrong | playtest coverage |
|----------|---------------------|-------------------|
| plan mode | no files written, just preview | happy paths 1, 2 |
| apply mode | files written to storage | happy path 3 |

**verdict:** both modes are tested.

### 5. file system edge cases

| scenario | what could go wrong | playtest coverage |
|----------|---------------------|-------------------|
| storage dir doesn't exist | mkdir fails | implicit (apply mode creates it) |
| disk full | write fails | not tested |
| permission denied | write fails | not tested |

**verdict:** disk full and permission errors are environmental. the fix uses shell redirect which produces clear errors: "No space left on device" or "Permission denied". these don't need playtest coverage.

### 6. hash command availability

| scenario | what could go wrong | playtest coverage |
|----------|---------------------|-------------------|
| sha256sum present (Linux) | typical | implicit |
| shasum present (macOS) | fallback | implicit |
| neither present | hash fails | not tested |

**verdict:** the implementation uses `(sha256sum 2>/dev/null || shasum -a 256)` which is portable. "neither present" is rare and produces a clear shell error. no playtest needed.

---

## unusual but valid inputs

| input | is it tested? | notes |
|-------|---------------|-------|
| binary files in diff | not tested | git handles binary as "Binary files differ" |
| unicode filenames | not tested | shell handles via quotes |
| very long filenames | not tested | rare edge case |
| symlinks | not tested | git treats as files |
| submodules | not tested | git diff shows submodule changes |

**verdict:** these are git edge cases, not ENOBUFS fix edge cases. the fix uses shell redirect which handles any git diff output. no special playtest needed.

---

## boundaries tested

| boundary | tested? | evidence |
|----------|---------|----------|
| 0 bytes (empty diff) | yes | edgey paths: "staged.patch = 0ytes" |
| 1 byte (minimal diff) | no | would be contrived |
| ~1MB (prior threshold) | yes | happy path 2: 1.2MB |
| very large diff (100MB+) | no | impractical for interactive playtest |

**verdict:** the critical boundary (>1MB) is tested. the 0 byte boundary is tested. very large diffs would be slow and use the same mechanism.

---

## found issues and fixes

### no issues found

the playtest covers:
- the critical edge case (>1MB diff that caused ENOBUFS)
- empty diff edge case
- mixed staged/unstaged edge case
- both plan and apply modes

gaps exist but are acceptable:
- exact threshold boundaries: 1.2MB provides margin
- unstaged only: symmetric code path
- environmental errors: shell produces clear messages
- rare inputs (binary, unicode): handled by git/shell

---

## why it holds

1. **critical edge case covered** — 1.2MB diff exceeds 1MB threshold
2. **empty diff tested** — "staged.patch = 0ytes"
3. **mixed state tested** — "both staged and unstaged"
4. **modes tested** — plan and apply
5. **acceptable gaps** — environmental/rare cases handled by shell

---

## summary

| check | status | evidence |
|-------|--------|----------|
| >1MB threshold tested | yes | happy path 2: 15000 lines = 1.2MB |
| 0 byte boundary tested | yes | edgey paths: empty staged diff |
| plan mode tested | yes | happy paths 1, 2 |
| apply mode tested | yes | happy path 3 |
| mixed state tested | yes | edgey paths: both staged and unstaged |
| gaps acceptable | yes | environmental/rare cases |

**conclusion:** edge cases are adequately covered. the critical boundary (>1MB) is tested with margin. empty and mixed states are tested. gaps are acceptable because they're environmental or use the same code path.

r2 complete.
